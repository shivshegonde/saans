import { Firestore } from "@google-cloud/firestore";
import { Clock } from "./core/ports/clock.js";
import { SystemClock } from "./adapters/systemClock.js";
import { FakeClock } from "./adapters/fakeClock.js";
import { AirQualityProvider } from "./core/ports/airProvider.js";
import { ScenarioProvider } from "./adapters/scenarioProvider.js";
import { OpenMeteoProvider } from "./adapters/openMeteoProvider.js";
import { ProviderChain } from "./adapters/providerChain.js";
import { config, Config } from "./config.js";

// Repositories
import { HouseholdRepository } from "./repositories/ports/householdRepo.js";
import { AuditRepository } from "./repositories/ports/auditRepo.js";
import { OutboxRepository } from "./repositories/ports/outboxRepo.js";
import { CommunityRepository } from "./repositories/ports/communityRepo.js";
import { MemoryHouseholdRepository } from "./repositories/memory/memoryHouseholdRepo.js";
import { MemoryAuditRepository } from "./repositories/memory/memoryAuditRepo.js";
import { MemoryOutboxRepository } from "./repositories/memory/memoryOutboxRepo.js";
import { MemoryCommunityRepository } from "./repositories/memory/memoryCommunityRepo.js";
import { FirestoreHouseholdRepository } from "./repositories/firestore/firestoreHouseholdRepo.js";
import { FirestoreAuditRepository } from "./repositories/firestore/firestoreAuditRepo.js";
import { FirestoreOutboxRepository } from "./repositories/firestore/firestoreOutboxRepo.js";
import { FirestoreCommunityRepository } from "./repositories/firestore/firestoreCommunityRepo.js";

// Services
import { AuthService } from "./services/auth.service.js";
import { InvitationService } from "./services/invitation.service.js";
import { HouseholdService } from "./services/household.service.js";
import { PlanService } from "./services/plan.service.js";
import { ImpactService } from "./services/impact.service.js";
import { CommunityService } from "./services/community.service.js";
import { AlertService } from "./services/alert.service.js";
import { OutboxService, EmailSender, ConsoleEmailSender } from "./services/outbox.service.js";
import { AuditService } from "./services/audit.service.js";
import { DemoService } from "./services/demo.service.js";

export interface Container {
  clock: Clock;
  airProvider: AirQualityProvider;
  scenarioProvider: ScenarioProvider;
  config: Config;
  householdRepo: HouseholdRepository;
  auditRepo: AuditRepository;
  outboxRepo: OutboxRepository;
  communityRepo: CommunityRepository;
  emailSender: EmailSender;
  authService: AuthService;
  invitationService: InvitationService;
  householdService: HouseholdService;
  planService: PlanService;
  impactService: ImpactService;
  communityService: CommunityService;
  alertService: AlertService;
  outboxService: OutboxService;
  auditService: AuditService;
  demoService: DemoService;
}

interface Repositories {
  householdRepo: HouseholdRepository;
  auditRepo: AuditRepository;
  outboxRepo: OutboxRepository;
  communityRepo: CommunityRepository;
}

function resolveClock(cfg: Config, overrides?: Partial<Container>): Clock {
  if (overrides?.clock) return overrides.clock;
  return cfg.NODE_ENV === "test" ? new FakeClock() : new SystemClock();
}

function resolveProviders(cfg: Config, clock: Clock, overrides?: Partial<Container>) {
  const scenario = new ScenarioProvider(clock, "Severe");
  const openMeteo = new OpenMeteoProvider(clock);

  const providerList: AirQualityProvider[] = [];
  const order = cfg.AQ_PROVIDER_ORDER.split(",").map((s) => s.trim().toLowerCase());
  for (const p of order) {
    if (p === "openmeteo") providerList.push(openMeteo);
    if (p === "scenario") providerList.push(scenario);
  }
  if (providerList.length === 0) providerList.push(scenario);

  const chain = overrides?.airProvider || new ProviderChain(providerList, clock);
  return { scenario, chain };
}

function createDefaultRepositories(cfg: Config, clock: Clock): Repositories {
  if (cfg.NODE_ENV === "production" && process.env["USE_FIRESTORE"] === "true") {
    const db = new Firestore({ projectId: cfg.GCP_PROJECT_ID, databaseId: cfg.FIRESTORE_DATABASE });
    return {
      householdRepo: new FirestoreHouseholdRepository(db, clock),
      auditRepo: new FirestoreAuditRepository(db),
      outboxRepo: new FirestoreOutboxRepository(db, clock),
      communityRepo: new FirestoreCommunityRepository(db),
    };
  }

  return {
    householdRepo: new MemoryHouseholdRepository(clock),
    auditRepo: new MemoryAuditRepository(),
    outboxRepo: new MemoryOutboxRepository(clock),
    communityRepo: new MemoryCommunityRepository(),
  };
}

function extractRepoOverrides(overrides: Partial<Container>): Partial<Repositories> {
  const result: Partial<Repositories> = {};
  if (overrides.householdRepo) result.householdRepo = overrides.householdRepo;
  if (overrides.auditRepo) result.auditRepo = overrides.auditRepo;
  if (overrides.outboxRepo) result.outboxRepo = overrides.outboxRepo;
  if (overrides.communityRepo) result.communityRepo = overrides.communityRepo;
  return result;
}

function createDefaultServices(
  repos: Repositories,
  providers: { scenario: ScenarioProvider; chain: AirQualityProvider },
  clock: Clock,
  cfg: Config,
) {
  const emailSender = new ConsoleEmailSender();
  const authService = new AuthService(repos.householdRepo, repos.auditRepo, clock);
  const invitationService = new InvitationService(repos.householdRepo, repos.auditRepo, clock);
  const householdService = new HouseholdService(repos.householdRepo, repos.auditRepo, clock);
  const planService = new PlanService(repos.householdRepo, repos.auditRepo, providers.chain, clock);
  const impactService = new ImpactService();
  const communityService = new CommunityService(
    repos.communityRepo,
    repos.auditRepo,
    repos.outboxRepo,
    clock,
    cfg.K_ANONYMITY_MIN,
  );
  const alertService = new AlertService(
    repos.householdRepo,
    repos.outboxRepo,
    repos.auditRepo,
    providers.chain,
    clock,
  );
  const outboxService = new OutboxService(repos.outboxRepo, emailSender, clock);
  const auditService = new AuditService(repos.auditRepo);
  const demoService = new DemoService(
    clock instanceof FakeClock ? clock : new FakeClock(),
    providers.scenario,
    alertService,
    repos.auditRepo,
    authService,
  );

  return {
    emailSender,
    authService,
    invitationService,
    householdService,
    planService,
    impactService,
    communityService,
    alertService,
    outboxService,
    auditService,
    demoService,
  };
}

export function createContainer(overrides?: Partial<Container>): Container {
  const cfg = overrides?.config ?? config;
  const clock = resolveClock(cfg, overrides);
  const { scenario, chain } = resolveProviders(cfg, clock, overrides);
  const repos: Repositories = {
    ...createDefaultRepositories(cfg, clock),
    ...(overrides ? extractRepoOverrides(overrides) : {}),
  };
  const services = {
    ...createDefaultServices(repos, { scenario, chain }, clock, cfg),
    ...overrides,
  };

  return {
    clock,
    airProvider: chain,
    scenarioProvider: scenario,
    config: cfg,
    ...repos,
    ...services,
  };
}

export const container = createContainer();
