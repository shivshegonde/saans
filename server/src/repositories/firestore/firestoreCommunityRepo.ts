import { Firestore } from "@google-cloud/firestore";
import { CommunityRepository, CommunityMembershipRecord } from "../ports/communityRepo.js";
import { CommunityDto, PledgeDto, AdvisoryDto } from "shared";

export class FirestoreCommunityRepository implements CommunityRepository {
  constructor(private db: Firestore) {}

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
    await this.db.collection("communities").doc(comm.id).set(dto);
    return dto;
  }

  async getCommunity(id: string): Promise<CommunityDto | null> {
    const doc = await this.db.collection("communities").doc(id).get();
    if (!doc.exists) return null;
    return doc.data() as CommunityDto;
  }

  async getCommunityByJoinCode(joinCode: string): Promise<CommunityDto | null> {
    const snap = await this.db
      .collection("communities")
      .where("joinCode", "==", joinCode.toUpperCase())
      .limit(1)
      .get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    if (!doc) return null;
    return doc.data() as CommunityDto;
  }

  async listCommunitiesForHousehold(householdId: string): Promise<CommunityDto[]> {
    const membershipsSnap = await this.db
      .collection("communityMemberships")
      .where("householdId", "==", householdId)
      .get();
    const communityIds = membershipsSnap.docs.map((d) => d.data().communityId as string);
    if (communityIds.length === 0) return [];

    const communities: CommunityDto[] = [];
    for (const cid of communityIds) {
      const c = await this.getCommunity(cid);
      if (c) communities.push(c);
    }
    return communities;
  }

  async joinCommunity(record: CommunityMembershipRecord): Promise<void> {
    const docId = `${record.communityId}_${record.householdId}`;
    await this.db.collection("communityMemberships").doc(docId).set(record);

    // Recalculate memberCount
    const countSnap = await this.db
      .collection("communityMemberships")
      .where("communityId", "==", record.communityId)
      .get();
    await this.db.collection("communities").doc(record.communityId).update({
      memberCount: countSnap.size,
    });
  }

  async leaveCommunity(communityId: string, householdId: string): Promise<void> {
    const docId = `${communityId}_${householdId}`;
    await this.db.collection("communityMemberships").doc(docId).delete();

    const countSnap = await this.db
      .collection("communityMemberships")
      .where("communityId", "==", communityId)
      .get();
    await this.db.collection("communities").doc(communityId).update({
      memberCount: countSnap.size,
    });
  }

  async getCommunityMemberships(communityId: string): Promise<CommunityMembershipRecord[]> {
    const snap = await this.db
      .collection("communityMemberships")
      .where("communityId", "==", communityId)
      .get();
    return snap.docs.map((d) => d.data() as CommunityMembershipRecord);
  }

  async getHouseholdMembership(
    communityId: string,
    householdId: string,
  ): Promise<CommunityMembershipRecord | null> {
    const docId = `${communityId}_${householdId}`;
    const doc = await this.db.collection("communityMemberships").doc(docId).get();
    if (!doc.exists) return null;
    return doc.data() as CommunityMembershipRecord;
  }

  async createPledge(pledge: PledgeDto): Promise<PledgeDto> {
    await this.db.collection("pledges").doc(pledge.id).set(pledge);
    const commRef = this.db.collection("communities").doc(pledge.communityId);
    const commDoc = await commRef.get();
    if (commDoc.exists) {
      const comm = commDoc.data() as CommunityDto;
      await commRef.update({ activePledgesCount: (comm.activePledgesCount || 0) + 1 });
    }
    return pledge;
  }

  async listPledges(communityId: string): Promise<PledgeDto[]> {
    const snap = await this.db.collection("pledges").where("communityId", "==", communityId).get();
    return snap.docs.map((d) => d.data() as PledgeDto);
  }

  async participateInPledge(pledgeId: string, userId: string): Promise<void> {
    const partRef = this.db.collection("pledgeParticipants").doc(`${pledgeId}_${userId}`);
    const exists = await partRef.get();
    if (!exists.exists) {
      await partRef.set({ pledgeId, userId, at: new Date().toISOString() });
      const pledgeRef = this.db.collection("pledges").doc(pledgeId);
      const pDoc = await pledgeRef.get();
      if (pDoc.exists) {
        const p = pDoc.data() as PledgeDto;
        await pledgeRef.update({
          currentParticipants: (p.currentParticipants || 0) + 1,
          currentCo2eKg: (p.currentCo2eKg || 0) + 12.5,
        });
      }
    }
  }

  async hasUserPledged(pledgeId: string, userId: string): Promise<boolean> {
    const doc = await this.db.collection("pledgeParticipants").doc(`${pledgeId}_${userId}`).get();
    return doc.exists;
  }

  async createAdvisory(advisory: AdvisoryDto): Promise<AdvisoryDto> {
    await this.db.collection("advisories").doc(advisory.id).set(advisory);
    return advisory;
  }

  async getAdvisory(id: string): Promise<AdvisoryDto | null> {
    const doc = await this.db.collection("advisories").doc(id).get();
    if (!doc.exists) return null;
    return doc.data() as AdvisoryDto;
  }

  async updateAdvisory(advisory: AdvisoryDto): Promise<void> {
    await this.db.collection("advisories").doc(advisory.id).set(advisory, { merge: true });
  }

  async listAdvisories(communityId: string): Promise<AdvisoryDto[]> {
    const snap = await this.db
      .collection("advisories")
      .where("communityId", "==", communityId)
      .orderBy("createdAt", "desc")
      .get();
    return snap.docs.map((d) => d.data() as AdvisoryDto);
  }
}
