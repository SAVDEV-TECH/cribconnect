import { NextRequest, NextResponse } from "next/server";
import {
  getUsersStore,
  getListingsStore,
  getBookingsStore,
  getEscrowDepositsStore,
  getRequestsStore,
  getReportsStore,
  confirmEscrowPayment,
  markEscrowDisbursed,
  markRentalDisbursed,
  updateUser,
  updateListingStore,
  deleteListingById,
  updateReportStore,
} from "@/lib/data-store";
import { requireAdmin } from "@/lib/session";
import { sanitizeText } from "@/lib/auth-security";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const [users, listings, bookings, escrows, requests, reports] = await Promise.all([
      getUsersStore(),
      getListingsStore(),
      getBookingsStore(),
      getEscrowDepositsStore(),
      getRequestsStore(),
      getReportsStore(),
    ]);

    // Build unified directory strictly of Agents & House Owners (Landlords)
    const providerMap = new Map<string, any>();

    for (const u of users) {
      if (u.role !== "AGENT" && u.role !== "LANDLORD") continue;
      providerMap.set(u.id, {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        whatsapp: u.whatsapp,
        role: u.role,
        agencyName: u.agencyName || (u.role === "LANDLORD" ? "Property Owner" : "Independent Realtor"),
        avatar: u.avatar,
        isVerified: u.isVerified,
        verificationStatus: u.verificationStatus || (u.isVerified ? "VERIFIED" : "UNVERIFIED"),
        ninOrLicense: u.ninOrLicense || "",
        bankName: u.bankName || "",
        bankAccountNumber: u.bankAccountNumber || "",
        bankAccountName: u.bankAccountName || "",
        tenantsHousedCount: u.tenantsHousedCount || 0,
        rentalsHistory: u.rentalsHistory || [],
        createdAt: u.createdAt,
      });
    }

    const providers = Array.from(providerMap.values()).map((p) => {
      const myListings = listings.filter((l) => l.agentId === p.id);
      const myListingIds = new Set(myListings.map((l) => l.id));

      const viewsCount = myListings.reduce((sum, l) => sum + (l.viewsCount || 0), 0);
      const whatsappConnects = myListings.reduce((sum, l) => sum + (l.whatsappClicksCount || 0), 0);

      const myBookings = bookings.filter(
        (b) => b.agentId === p.id || myListingIds.has(b.listingId)
      );

      const myEscrows = escrows.filter(
        (e) => e.agentId === p.id || myListingIds.has(e.listingId)
      );

      const releasedEscrows = myEscrows.filter((e) => e.status === "RELEASED_TO_AGENT");
      const earnedEscrowPayout = releasedEscrows.reduce((sum, e) => sum + (e.agentPayout ?? 0), 0);
      const pendingEscrowPayout = releasedEscrows
        .filter((e) => e.payoutStatus !== "PAID_TO_BANK")
        .reduce((sum, e) => sum + (e.agentPayout ?? 0), 0);
      const paidEscrowPayout = releasedEscrows
        .filter((e) => e.payoutStatus === "PAID_TO_BANK")
        .reduce((sum, e) => sum + (e.agentPayout ?? 0), 0);

      const rentals: any[] = p.rentalsHistory || [];
      const earnedRentalCommission = rentals.reduce((sum, r) => {
        const fee = r.agencyFeeTotal ?? Math.round((r.amount ?? 0) * 0.1);
        const net = r.agentNetCommission ?? Math.round(fee * 0.8);
        return sum + net;
      }, 0);

      const pendingRentalCommission = rentals
        .filter((r) => r.payoutStatus !== "PAID_TO_BANK")
        .reduce((sum, r) => {
          const fee = r.agencyFeeTotal ?? Math.round((r.amount ?? 0) * 0.1);
          const net = r.agentNetCommission ?? Math.round(fee * 0.8);
          return sum + net;
        }, 0);

      const paidRentalCommission = rentals
        .filter((r) => r.payoutStatus === "PAID_TO_BANK")
        .reduce((sum, r) => {
          const fee = r.agencyFeeTotal ?? Math.round((r.amount ?? 0) * 0.1);
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

    const totalAgentsCount = providers.filter((p) => p.role === "AGENT").length;
    const totalOwnersCount = providers.filter((p) => p.role === "LANDLORD").length;
    const totalViews = listings.reduce((s, l) => s + (l.viewsCount || 0), 0);
    const totalWhatsappClicks = listings.reduce((s, l) => s + (l.whatsappClicksCount || 0), 0);
    const totalInspections = bookings.length;
    const totalEscrows = escrows.length;
    const totalConnects = totalViews + totalWhatsappClicks + totalInspections + totalEscrows;

    const escrowVaultBalance = escrows
      .filter((e) => e.status === "HELD_IN_ESCROW")
      .reduce((s, e) => s + (e.amount ?? 0), 0);

    const platformEscrowRevenue = escrows
      .filter((e) => e.status === "RELEASED_TO_AGENT")
      .reduce((s, e) => s + (e.platformFee ?? 0), 0);

    let platformAgencyRevenue = 0;
    const allRentalCommissions: any[] = [];
    for (const p of providers) {
      for (const r of p.rentalsHistory || []) {
        const fee = r.agencyFeeTotal ?? Math.round((r.amount ?? 0) * 0.1);
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
          payoutStatus: r.payoutStatus || "PENDING_VERIFICATION",
        });
      }
    }

    // Never expose student's raw releasePin or lookupToken in admin list responses
    const enrichedEscrows = escrows.map((e) => {
      const matchProvider = providers.find((p) => p.id === e.agentId);
      const { releasePin: _pin, lookupToken: _tok, ...safeEscrow } = e;
      return {
        ...safeEscrow,
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
        pendingReportsCount: reports.filter((r) => r.status === "PENDING").length,
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
      reports,
    });
  } catch (error) {
    console.error("Admin overview GET error:", error);
    return NextResponse.json({ error: "Failed to load admin overview" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const { action } = body;

    if (action === "CONFIRM_ESCROW_PAYMENT") {
      if (typeof body.escrowId !== "string" || !body.escrowId) {
        return NextResponse.json({ error: "Valid escrowId is required" }, { status: 400 });
      }
      const updated = await confirmEscrowPayment(body.escrowId);
      if (!updated) {
        return NextResponse.json({ error: "Escrow not found" }, { status: 404 });
      }
      const { releasePin: _pin, lookupToken: _tok, ...safe } = updated;
      return NextResponse.json({ success: true, escrow: safe });
    }

    if (action === "DISBURSE_ESCROW") {
      if (typeof body.escrowId !== "string" || !body.escrowId) {
        return NextResponse.json({ error: "Valid escrowId is required" }, { status: 400 });
      }
      const result = await markEscrowDisbursed(body.escrowId);
      if (!result.success || !result.escrow) {
        return NextResponse.json({ error: result.error || "Escrow cannot be disbursed" }, { status: 400 });
      }
      const { releasePin: _pin, lookupToken: _tok, ...safe } = result.escrow;
      return NextResponse.json({ success: true, escrow: safe });
    }

    if (action === "DISBURSE_RENTAL") {
      if (typeof body.userId !== "string" || typeof body.rentalId !== "string") {
        return NextResponse.json({ error: "Valid userId and rentalId are required" }, { status: 400 });
      }
      const ok = await markRentalDisbursed(body.userId, body.rentalId);
      if (!ok) {
        return NextResponse.json({ error: "Rental record not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true });
    }

    if (action === "TOGGLE_VERIFY_USER") {
      if (typeof body.userId !== "string" || !body.userId) {
        return NextResponse.json({ error: "Valid userId is required" }, { status: 400 });
      }
      const nextVerified = Boolean(body.isVerified);
      const updated = await updateUser(body.userId, {
        isVerified: nextVerified,
        verificationStatus: nextVerified ? "VERIFIED" : "UNVERIFIED",
        badges: nextVerified ? ["Verified Agent", "UNIPORT Specialist"] : [],
      });
      if (!updated) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Sync agentVerified badge across all listings owned by this provider
      const allListings = await getListingsStore();
      await Promise.all(
        allListings
          .filter((l) => l.agentId === updated.id)
          .map((l) => updateListingStore(l.id, { agentVerified: nextVerified }))
      );

      return NextResponse.json({
        success: true,
        user: {
          id: updated.id,
          name: updated.name,
          isVerified: updated.isVerified,
          verificationStatus: updated.verificationStatus,
        },
      });
    }

    if (action === "DELETE_LISTING") {
      if (typeof body.listingId !== "string" || !body.listingId) {
        return NextResponse.json({ error: "Valid listingId is required" }, { status: 400 });
      }
      const deleted = await deleteListingById(body.listingId);
      if (!deleted) {
        return NextResponse.json({ error: "Listing not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true });
    }

    if (action === "UPDATE_REPORT") {
      const reportId = typeof body.reportId === "string" ? body.reportId : "";
      const status = body.status;
      if (!reportId || !["PENDING", "RESOLVED", "DISMISSED"].includes(status)) {
        return NextResponse.json({ error: "Valid reportId and status are required" }, { status: 400 });
      }
      const updated = await updateReportStore(reportId, {
        status,
        adminNotes: body.adminNotes ? sanitizeText(body.adminNotes, 500) : null,
      });
      if (!updated) {
        return NextResponse.json({ error: "Report not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, report: updated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Admin overview POST error:", error);
    return NextResponse.json({ error: "Failed to execute admin action" }, { status: 500 });
  }
}
