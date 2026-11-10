import { NextRequest, NextResponse } from "next/server";
import {
  getUsersStore,
  getListingsStore,
  getBookingsStore,
  getEscrowDepositsStore,
  getRequestsStore,
  confirmEscrowPayment,
  markEscrowDisbursed,
  markRentalDisbursed,
  updateUser,
  deleteListingById,
} from "@/lib/data-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [users, listings, bookings, escrows, requests] = await Promise.all([
      getUsersStore(),
      getListingsStore(),
      getBookingsStore(),
      getEscrowDepositsStore(),
      getRequestsStore(),
    ]);

    // Build unified directory of Agents & House Owners (Landlords)
    const providerMap = new Map<string, any>();

    for (const u of users) {
      providerMap.set(u.id, {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        whatsapp: u.whatsapp,
        role: u.role === "LANDLORD" ? "LANDLORD" : "AGENT",
        agencyName: u.agencyName || (u.role === "LANDLORD" ? "Property Owner" : "Independent Realtor"),
        avatar: u.avatar,
        isVerified: u.isVerified,
        bankName: u.bankName || "",
        bankAccountNumber: u.bankAccountNumber || "",
        bankAccountName: u.bankAccountName || "",
        tenantsHousedCount: u.tenantsHousedCount || 0,
        rentalsHistory: u.rentalsHistory || [],
        createdAt: u.createdAt,
      });
    }

    // Also ensure any listing uploader is represented even if created before user sync
    for (const l of listings) {
      const key = l.agentId || l.agentName;
      if (!providerMap.has(key)) {
        providerMap.set(key, {
          id: key,
          name: l.agentName,
          email: "",
          phone: l.agentPhone,
          whatsapp: l.agentWhatsapp,
          role: l.agencyName?.toLowerCase().includes("owner") || l.agencyName?.toLowerCase().includes("landlord") ? "LANDLORD" : "AGENT",
          agencyName: l.agencyName || "Independent Realtor",
          avatar: l.agentAvatar,
          isVerified: l.agentVerified,
          bankName: "",
          bankAccountNumber: "",
          bankAccountName: "",
          tenantsHousedCount: 0,
          rentalsHistory: [],
          createdAt: l.createdAt,
        });
      }
    }

    const providers = Array.from(providerMap.values()).map((p) => {
      const myListings = listings.filter(
        (l) => l.agentId === p.id || l.agentName.toLowerCase() === p.name.toLowerCase()
      );
      const myListingIds = new Set(myListings.map((l) => l.id));

      const viewsCount = myListings.reduce((sum, l) => sum + (l.viewsCount || 0), 0);
      const whatsappConnects = myListings.reduce((sum, l) => sum + (l.whatsappClicksCount || 0), 0);

      const myBookings = bookings.filter(
        (b) =>
          b.agentId === p.id ||
          b.agentName?.toLowerCase() === p.name.toLowerCase() ||
          myListingIds.has(b.listingId)
      );

      const myEscrows = escrows.filter(
        (e) =>
          e.agentId === p.id ||
          e.agentName.toLowerCase() === p.name.toLowerCase() ||
          myListingIds.has(e.listingId)
      );

      const releasedEscrows = myEscrows.filter((e) => e.status === "RELEASED_TO_AGENT");
      const earnedEscrowPayout = releasedEscrows.reduce((sum, e) => sum + (e.agentPayout || 9000), 0);
      const pendingEscrowPayout = releasedEscrows
        .filter((e) => e.payoutStatus !== "PAID_TO_BANK")
        .reduce((sum, e) => sum + (e.agentPayout || 9000), 0);
      const paidEscrowPayout = releasedEscrows
        .filter((e) => e.payoutStatus === "PAID_TO_BANK")
        .reduce((sum, e) => sum + (e.agentPayout || 9000), 0);

      const rentals: any[] = p.rentalsHistory || [];
      const earnedRentalCommission = rentals.reduce((sum, r) => {
        const fee = r.agencyFeeTotal ?? Math.round((r.amount || 0) * 0.1);
        const net = r.agentNetCommission ?? Math.round(fee * 0.8);
        return sum + net;
      }, 0);

      const pendingRentalCommission = rentals
        .filter((r) => r.payoutStatus !== "PAID_TO_BANK")
        .reduce((sum, r) => {
          const fee = r.agencyFeeTotal ?? Math.round((r.amount || 0) * 0.1);
          const net = r.agentNetCommission ?? Math.round(fee * 0.8);
          return sum + net;
        }, 0);

      const paidRentalCommission = rentals
        .filter((r) => r.payoutStatus === "PAID_TO_BANK")
        .reduce((sum, r) => {
          const fee = r.agencyFeeTotal ?? Math.round((r.amount || 0) * 0.1);
          const net = r.agentNetCommission ?? Math.round(fee * 0.8);
          return sum + net;
        }, 0);

      const totalConnects =
        viewsCount + whatsappConnects + myBookings.length + myEscrows.length;

      return {
        ...p,
        listingsCount: myListings.length,
        viewsCount,
        whatsappConnects,
        inspectionsCount: myBookings.length,
        escrowsCount: myEscrows.length,
        totalConnects,
        earnedTotal: earnedEscrowPayout + earnedRentalCommission,
        pendingBankPayout: pendingEscrowPayout + pendingRentalCommission,
        paidBankPayout: paidEscrowPayout + paidRentalCommission,
      };
    });

    // Platform-wide KPI calculations
    const totalAgentsCount = providers.filter((p) => p.role === "AGENT").length;
    const totalOwnersCount = providers.filter((p) => p.role === "LANDLORD").length;
    const totalViews = listings.reduce((s, l) => s + (l.viewsCount || 0), 0);
    const totalWhatsappClicks = listings.reduce((s, l) => s + (l.whatsappClicksCount || 0), 0);
    const totalInspections = bookings.length;
    const totalEscrows = escrows.length;
    const totalConnects = totalViews + totalWhatsappClicks + totalInspections + totalEscrows;

    const escrowVaultBalance = escrows
      .filter((e) => e.status === "HELD_IN_ESCROW")
      .reduce((s, e) => s + (e.amount || 10000), 0);

    const platformEscrowRevenue = escrows
      .filter((e) => e.status === "RELEASED_TO_AGENT")
      .reduce((s, e) => s + (e.platformFee || 1000), 0);

    let platformAgencyRevenue = 0;
    const allRentalCommissions: any[] = [];
    for (const p of providers) {
      for (const r of p.rentalsHistory || []) {
        const fee = r.agencyFeeTotal ?? Math.round((r.amount || 0) * 0.1);
        const cribCut = r.platformCommission ?? Math.round(fee * 0.2);
        const agentNet = r.agentNetCommission ?? fee - cribCut;
        platformAgencyRevenue += cribCut;
        allRentalCommissions.push({
          ...r,
          userId: p.id,
          agentName: p.name,
          agentRole: p.role,
          bankName: p.bankName,
          bankAccountNumber: p.bankAccountNumber,
          bankAccountName: p.bankAccountName,
          agencyFeeTotal: fee,
          platformCommission: cribCut,
          agentNetCommission: agentNet,
          payoutStatus: r.payoutStatus || "APPROVED_FOR_PAYOUT",
        });
      }
    }

    const enrichedEscrows = escrows.map((e) => {
      const matchProvider = providers.find(
        (p) => p.id === e.agentId || p.name.toLowerCase() === e.agentName.toLowerCase()
      );
      return {
        ...e,
        bankName: matchProvider?.bankName || "",
        bankAccountNumber: matchProvider?.bankAccountNumber || "",
        bankAccountName: matchProvider?.bankAccountName || "",
      };
    });

    const totalPendingPayouts = providers.reduce((s, p) => s + p.pendingBankPayout, 0);
    const totalDisbursedPayouts = providers.reduce((s, p) => s + p.paidBankPayout, 0);

    return NextResponse.json({
      success: true,
      kpis: {
        totalAgentsCount,
        totalOwnersCount,
        totalProvidersCount: providers.length,
        totalPropertiesCount: listings.length,
        totalRequestsCount: requests.length,
        totalViews,
        totalWhatsappClicks,
        totalInspections,
        totalEscrows,
        totalConnects,
        escrowVaultBalance,
        platformEscrowRevenue,
        platformAgencyRevenue,
        totalPlatformRevenue: platformEscrowRevenue + platformAgencyRevenue,
        totalPendingPayouts,
        totalDisbursedPayouts,
      },
      providers,
      listings,
      bookings,
      escrows: enrichedEscrows,
      rentalCommissions: allRentalCommissions,
    });
  } catch (error) {
    console.error("Admin overview GET error:", error);
    return NextResponse.json({ error: "Failed to load admin overview" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "CONFIRM_ESCROW_PAYMENT") {
      const updated = await confirmEscrowPayment(body.escrowId);
      if (!updated) {
        return NextResponse.json({ error: "Escrow not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, escrow: updated });
    }

    if (action === "DISBURSE_ESCROW") {
      const updated = await markEscrowDisbursed(body.escrowId);
      if (!updated) {
        return NextResponse.json({ error: "Escrow not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, escrow: updated });
    }

    if (action === "DISBURSE_RENTAL") {
      const ok = await markRentalDisbursed(body.userId, body.rentalId);
      if (!ok) {
        return NextResponse.json({ error: "Rental record not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true });
    }

    if (action === "TOGGLE_VERIFY_USER") {
      const updated = await updateUser(body.userId, { isVerified: Boolean(body.isVerified) });
      return NextResponse.json({ success: true, user: updated });
    }

    if (action === "DELETE_LISTING") {
      await deleteListingById(body.listingId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Admin overview POST error:", error);
    return NextResponse.json({ error: "Failed to execute admin action" }, { status: 500 });
  }
}
