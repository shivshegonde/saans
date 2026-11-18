import { CommunityRepository, CommunityMembershipRecord } from "../ports/communityRepo.js";
import { CommunityDto, PledgeDto, AdvisoryDto } from "shared";

export class MemoryCommunityRepository implements CommunityRepository {
  private communities = new Map<string, CommunityDto>();
  private communitiesByJoinCode = new Map<string, string>(); // joinCode -> id
  private memberships = new Map<string, CommunityMembershipRecord>(); // communityId:householdId -> Record
  private pledges = new Map<string, PledgeDto>();
  private pledgeParticipants = new Set<string>(); // pledgeId:userId
  private advisories = new Map<string, AdvisoryDto>();

  async createCommunity(comm: {
    id: string;
    name: string;
    joinCode: string;
    description?: string;
  }): Promise<CommunityDto> {
    const dto: CommunityDto = {
      ...comm,
      memberCount: 0,
      activePledgesCount: 0,
    };
    this.communities.set(comm.id, dto);
    this.communitiesByJoinCode.set(comm.joinCode.toUpperCase(), comm.id);
    return { ...dto };
  }

  async getCommunity(id: string): Promise<CommunityDto | null> {
    const c = this.communities.get(id);
    return c ? { ...c } : null;
  }

  async getCommunityByJoinCode(joinCode: string): Promise<CommunityDto | null> {
    const id = this.communitiesByJoinCode.get(joinCode.toUpperCase());
    if (!id) return null;
    return this.getCommunity(id);
  }

  async listCommunitiesForHousehold(householdId: string): Promise<CommunityDto[]> {
    const commIds: string[] = [];
    for (const mem of this.memberships.values()) {
      if (mem.householdId === householdId) {
        commIds.push(mem.communityId);
      }
    }
    const result: CommunityDto[] = [];
    for (const cid of commIds) {
      const comm = this.communities.get(cid);
      if (comm) result.push({ ...comm });
    }
    return result;
  }

  async joinCommunity(record: CommunityMembershipRecord): Promise<void> {
    const key = `${record.communityId}:${record.householdId}`;
    this.memberships.set(key, { ...record });
    const comm = this.communities.get(record.communityId);
    if (comm) {
      // recount unique households
      let count = 0;
      for (const m of this.memberships.values()) {
        if (m.communityId === record.communityId) count++;
      }
      comm.memberCount = count;
      this.communities.set(record.communityId, comm);
    }
  }

  async leaveCommunity(communityId: string, householdId: string): Promise<void> {
    const key = `${communityId}:${householdId}`;
    this.memberships.delete(key);
    const comm = this.communities.get(communityId);
    if (comm) {
      let count = 0;
      for (const m of this.memberships.values()) {
        if (m.communityId === communityId) count++;
      }
      comm.memberCount = count;
      this.communities.set(communityId, comm);
    }
  }

  async getCommunityMemberships(communityId: string): Promise<CommunityMembershipRecord[]> {
    const list: CommunityMembershipRecord[] = [];
    for (const mem of this.memberships.values()) {
      if (mem.communityId === communityId) {
        list.push({ ...mem });
      }
    }
    return list;
  }

  async getHouseholdMembership(
    communityId: string,
    householdId: string,
  ): Promise<CommunityMembershipRecord | null> {
    const mem = this.memberships.get(`${communityId}:${householdId}`);
    return mem ? { ...mem } : null;
  }

  async createPledge(pledge: PledgeDto): Promise<PledgeDto> {
    this.pledges.set(pledge.id, { ...pledge });
    const comm = this.communities.get(pledge.communityId);
    if (comm) {
      comm.activePledgesCount += 1;
      this.communities.set(pledge.communityId, comm);
    }
    return { ...pledge };
  }

  async listPledges(communityId: string): Promise<PledgeDto[]> {
    const list: PledgeDto[] = [];
    for (const p of this.pledges.values()) {
      if (p.communityId === communityId) {
        list.push({ ...p });
      }
    }
    return list;
  }

  async participateInPledge(pledgeId: string, userId: string): Promise<void> {
    const key = `${pledgeId}:${userId}`;
    if (!this.pledgeParticipants.has(key)) {
      this.pledgeParticipants.add(key);
      const p = this.pledges.get(pledgeId);
      if (p) {
        p.currentParticipants += 1;
        p.currentCo2eKg += 12.5; // average avoided kg
        this.pledges.set(pledgeId, p);
      }
    }
  }

  async hasUserPledged(pledgeId: string, userId: string): Promise<boolean> {
    return this.pledgeParticipants.has(`${pledgeId}:${userId}`);
  }

  async createAdvisory(advisory: AdvisoryDto): Promise<AdvisoryDto> {
    this.advisories.set(advisory.id, { ...advisory });
    return { ...advisory };
  }

  async getAdvisory(id: string): Promise<AdvisoryDto | null> {
    const adv = this.advisories.get(id);
    return adv ? { ...adv } : null;
  }

  async updateAdvisory(advisory: AdvisoryDto): Promise<void> {
    this.advisories.set(advisory.id, { ...advisory });
  }

  async listAdvisories(communityId: string): Promise<AdvisoryDto[]> {
    const list: AdvisoryDto[] = [];
    for (const a of this.advisories.values()) {
      if (a.communityId === communityId) {
        list.push({ ...a });
      }
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}
