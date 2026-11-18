import { CommunityDto, PledgeDto, AdvisoryDto } from "shared";

export interface CommunityMembershipRecord {
  communityId: string;
  householdId: string;
  userId: string;
  role: "COMMUNITY_ADMIN" | "COMMUNITY_MEMBER";
  joinedAt: Date;
}

export interface CommunityRepository {
  createCommunity(comm: {
    id: string;
    name: string;
    joinCode: string;
    description?: string;
  }): Promise<CommunityDto>;
  getCommunity(id: string): Promise<CommunityDto | null>;
  getCommunityByJoinCode(joinCode: string): Promise<CommunityDto | null>;
  listCommunitiesForHousehold(householdId: string): Promise<CommunityDto[]>;
  joinCommunity(record: CommunityMembershipRecord): Promise<void>;
  leaveCommunity(communityId: string, householdId: string): Promise<void>;
  getCommunityMemberships(communityId: string): Promise<CommunityMembershipRecord[]>;
  getHouseholdMembership(
    communityId: string,
    householdId: string,
  ): Promise<CommunityMembershipRecord | null>;

  // Pledges
  createPledge(pledge: PledgeDto): Promise<PledgeDto>;
  listPledges(communityId: string): Promise<PledgeDto[]>;
  participateInPledge(pledgeId: string, userId: string): Promise<void>;
  hasUserPledged(pledgeId: string, userId: string): Promise<boolean>;

  // Advisories
  createAdvisory(advisory: AdvisoryDto): Promise<AdvisoryDto>;
  getAdvisory(id: string): Promise<AdvisoryDto | null>;
  updateAdvisory(advisory: AdvisoryDto): Promise<void>;
  listAdvisories(communityId: string): Promise<AdvisoryDto[]>;
}
