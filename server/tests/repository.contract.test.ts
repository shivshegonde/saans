import { describe, it, expect, beforeEach } from "vitest";
import { Firestore } from "@google-cloud/firestore";
import { FakeClock } from "../src/adapters/fakeClock.js";
import { HouseholdRepository } from "../src/repositories/ports/householdRepo.js";
import { MemoryHouseholdRepository } from "../src/repositories/memory/memoryHouseholdRepo.js";
import { FirestoreHouseholdRepository } from "../src/repositories/firestore/firestoreHouseholdRepo.js";
import { HouseholdProfile } from "shared";

/**
 * Lightweight in-memory Firestore mock to support contract test execution without requiring cloud network.
 */
function createMockFirestore(): Firestore {
  const collections = new Map<string, Map<string, Record<string, unknown>>>();

  const getCol = (name: string) => {
    let col = collections.get(name);
    if (!col) {
      col = new Map<string, Record<string, unknown>>();
      collections.set(name, col);
    }
    return col;
  };

  const mockDb = {
    collection: (colName: string) => ({
      doc: (docId: string) => ({
        get: async () => {
          const data = getCol(colName).get(docId);
          return {
            exists: data !== undefined,
            id: docId,
            data: () => (data ? { ...data } : undefined),
          };
        },
        set: async (data: Record<string, unknown>) => {
          getCol(colName).set(docId, { ...data });
        },
        update: async (data: Record<string, unknown>) => {
          const existing = getCol(colName).get(docId) ?? {};
          getCol(colName).set(docId, { ...existing, ...data });
        },
        delete: async () => {
          getCol(colName).delete(docId);
        },
      }),
      where: (field: string, op: string, val: unknown) => {
        const queryObj = {
          where: (field2: string, op2: string, val2: unknown) => ({
            limit: (_n: number) => ({
              get: async () => {
                const results: Array<{ id: string; data: () => Record<string, unknown> }> = [];
                for (const [id, d] of getCol(colName).entries()) {
                  if (d[field] === val && d[field2] === val2) {
                    results.push({ id, data: () => ({ ...d }) });
                  }
                }
                return { empty: results.length === 0, docs: results };
              },
            }),
            get: async () => {
              const results: Array<{ id: string; data: () => Record<string, unknown> }> = [];
              for (const [id, d] of getCol(colName).entries()) {
                if (d[field] === val && d[field2] === val2) {
                  results.push({ id, data: () => ({ ...d }) });
                }
              }
              return { empty: results.length === 0, docs: results };
            },
          }),
          limit: (_n: number) => ({
            get: async () => {
              const results: Array<{ id: string; data: () => Record<string, unknown> }> = [];
              for (const [id, d] of getCol(colName).entries()) {
                if (d[field] === val) {
                  results.push({ id, data: () => ({ ...d }) });
                }
              }
              return { empty: results.length === 0, docs: results };
            },
          }),
          get: async () => {
            const results: Array<{ id: string; data: () => Record<string, unknown> }> = [];
            for (const [id, d] of getCol(colName).entries()) {
              if (d[field] === val) {
                results.push({ id, data: () => ({ ...d }) });
              }
            }
            return { empty: results.length === 0, docs: results };
          },
        };
        return queryObj;
      },
    }),
    batch: () => {
      const ops: Array<() => void> = [];
      return {
        set: (ref: { set: (d: unknown) => void }, data: unknown) => {
          ops.push(() => ref.set(data));
        },
        update: (ref: { update: (d: unknown) => void }, data: unknown) => {
          ops.push(() => ref.update(data));
        },
        delete: (ref: { delete: () => void }) => {
          ops.push(() => ref.delete());
        },
        commit: async () => {
          for (const op of ops) op();
        },
      };
    },
  };

  return mockDb as unknown as Firestore;
}

describe("LSP Repository Contract Suite (Section 7 Architecture & LSP Invariants)", () => {
  const implementations: Array<{
    name: string;
    factory: (clock: FakeClock) => HouseholdRepository;
  }> = [
    {
      name: "MemoryHouseholdRepository",
      factory: (clock) => new MemoryHouseholdRepository(clock),
    },
    {
      name: "FirestoreHouseholdRepository",
      factory: (clock) => new FirestoreHouseholdRepository(createMockFirestore(), clock),
    },
  ];

  for (const { name, factory } of implementations) {
    describe(`Contract: ${name}`, () => {
      let repo: HouseholdRepository;
      let clock: FakeClock;

      beforeEach(() => {
        clock = new FakeClock();
        repo = factory(clock);
      });

      it("creates and retrieves a household profile with owner membership", async () => {
        const profile: HouseholdProfile = {
          id: "hh-contract-1",
          name: "Contract Test Household",
          location: { name: "Delhi", lat: 28.6, lng: 77.2 },
          members: [
            {
              id: "mem-1",
              name: "Aarav",
              ageGroup: "child",
              sensitiveFlags: {
                child: true,
                olderAdult: false,
                respiratoryCondition: true,
                pregnancy: false,
              },
              commuteMode: "metro",
              commuteDistanceKm: 10,
            },
          ],
          rooms: [
            {
              id: "room-1",
              name: "Living Room",
              volumeM3: 70,
              hasPurifier: true,
              purifierCadrM3h: 300,
              windowsHabit: "closed",
            },
          ],
          cookingFuel: "lpg",
          aiPersonalizationConsent: true,
          shareWithCommunityConsent: false,
          preferredLanguage: "en",
        };

        const created = await repo.createHousehold(profile, "user-owner-1");
        expect(created.id).toBe("hh-contract-1");

        const fetched = await repo.getHousehold("hh-contract-1");
        expect(fetched).not.toBeNull();
        expect(fetched?.name).toBe("Contract Test Household");
        expect(fetched?.members[0]?.sensitiveFlags.respiratoryCondition).toBe(true);
      });

      it("manages user records and queries by email and id", async () => {
        const user = await repo.createUser({
          id: "user-c-1",
          email: "contract@delhi.local",
          passwordHash: "scrypt:salt:key",
          displayName: "Contract User",
        });

        expect(user.email).toBe("contract@delhi.local");

        const byEmail = await repo.getUserByEmail("contract@delhi.local");
        expect(byEmail?.id).toBe("user-c-1");

        const byId = await repo.getUserById("user-c-1");
        expect(byId?.displayName).toBe("Contract User");
      });

      it("creates and deletes opaque sessions", async () => {
        const session = await repo.createSession({
          tokenHash: "token-sha256-hash",
          userId: "user-c-1",
          householdId: "hh-c-1",
          expiresAt: new Date(clock.now().getTime() + 86400000),
        });

        expect(session.userId).toBe("user-c-1");

        const fetched = await repo.getSession("token-sha256-hash");
        expect(fetched).not.toBeNull();
        expect(fetched?.householdId).toBe("hh-c-1");

        await repo.deleteSession("token-sha256-hash");
        const afterDelete = await repo.getSession("token-sha256-hash");
        expect(afterDelete).toBeNull();
      });

      it("updates and deletes household cleanly", async () => {
        const profile: HouseholdProfile = {
          id: "hh-update-1",
          name: "Original Name",
          location: { name: "Delhi", lat: 28.6, lng: 77.2 },
          members: [],
          rooms: [],
          cookingFuel: "lpg",
          aiPersonalizationConsent: false,
          shareWithCommunityConsent: false,
          preferredLanguage: "en",
        };

        await repo.createHousehold(profile, "user-owner-1");
        const updated = await repo.updateHousehold("hh-update-1", { name: "Updated Name" });
        expect(updated.name).toBe("Updated Name");

        await repo.deleteHousehold("hh-update-1");
        const afterDelete = await repo.getHousehold("hh-update-1");
        expect(afterDelete).toBeNull();
      });
    });
  }
});
