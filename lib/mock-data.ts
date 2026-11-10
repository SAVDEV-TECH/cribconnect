// lib/mock-data.ts
// All demo/mock data removed. Platform uses real user-uploaded listings, requests, and accounts.

export const MOCK_USERS: any[] = [];
export const MOCK_AGENT_PROFILES: any[] = [];
export const MOCK_LISTINGS: any[] = [];
export const MOCK_HOUSING_REQUESTS: any[] = [];
export const MOCK_PROPOSALS: any[] = [];
export const MOCK_MESSAGES: any[] = [];
export const MOCK_REVIEWS: any[] = [];

export function getListingWithAgent(listing: any) {
  return { ...listing, agent: null };
}

export function getRequestWithDetails(request: any) {
  return { ...request, student: null, proposals: [] };
}
