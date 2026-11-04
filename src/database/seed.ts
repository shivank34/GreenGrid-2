import { PrismaClient, UserRole, UserStatus, FacilityType, MeterType, MeterStatus, AlertSeverity, AlertStatus, OptimizationCategory, OptimizationStatus, InvoiceStatus, LeadStatus } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting GreenGrid database seed...');

  // 1. Clean existing records (in reverse dependency order)
  await prisma.auditLog.deleteMany();
  await prisma.dailyEnergyRollup.deleteMany();
  await prisma.meterReading.deleteMany();
  await prisma.energyAlert.deleteMany();
  await prisma.optimizationRecommendation.deleteMany();
  await prisma.utilityInvoice.deleteMany();
  await prisma.assetMeter.deleteMany();
  await prisma.facility.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.leadInquiry.deleteMany();

  console.log('🧹 Cleaned existing tables.');

  // 2. Create Platform & Customer Organizations
  const greengridOrg = await prisma.organization.create({
    data: {
      name: 'GreenGrid Global Platform',
      slug: 'greengrid-global',
      plan: 'ENTERPRISE',
    },
  });

  const northstarOrg = await prisma.organization.create({
    data: {
      name: 'Northstar Logistics & Operations',
      slug: 'northstar-logistics',
      plan: 'ENTERPRISE_PLUS',
    },
  });

  // 3. Create Users with Argon2 password hashing
  const defaultPassword = 'Password123!';
  const passwordHash = await argon2.hash(defaultPassword);

  // Platform SuperAdmin
  const superAdmin = await prisma.user.create({
    data: {
      organizationId: greengridOrg.id,
      email: 'admin@greengrid.example',
      passwordHash,
      firstName: 'Antigravity',
      lastName: 'Architect',
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
    },
  });

  // Northstar Org Admin
  const orgAdmin = await prisma.user.create({
    data: {
      organizationId: northstarOrg.id,
      email: 'sarah.chen@northstar.example',
      passwordHash,
      firstName: 'Sarah',
      lastName: 'Chen',
      role: UserRole.ORG_ADMIN,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
    },
  });

  // Facility Manager
  const facilityManager = await prisma.user.create({
    data: {
      organizationId: northstarOrg.id,
      email: 'alex.miller@northstar.example',
      passwordHash,
      firstName: 'Alex',
      lastName: 'Miller',
      role: UserRole.FACILITY_MANAGER,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
    },
  });

  // Energy Analyst
  const energyAnalyst = await prisma.user.create({
    data: {
      organizationId: northstarOrg.id,
      email: 'james.reed@northstar.example',
      passwordHash,
      firstName: 'James',
      lastName: 'Reed',
      role: UserRole.ENERGY_ANALYST,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
    },
  });

  console.log(`👤 Seeded 4 users (Admin, OrgAdmin, FacilityManager, Analyst). Password: ${defaultPassword}`);

  // 4. Create Facilities (matching greengrid-landing-page.html)
  const westside = await prisma.facility.create({
    data: {
      organizationId: northstarOrg.id,
      name: 'Westside Operations',
      code: 'FAC-WSO-01',
      facilityType: FacilityType.WAREHOUSE_LOGISTICS,
      address: '742 Evergreen Blvd',
      city: 'Chicago',
      country: 'USA',
      timezone: 'America/Chicago',
      squareMeters: 28500,
      baselineKwhPerMonth: 95000,
      targetIntensityKwhM2: 84.0,
    },
  });

  const centralDist = await prisma.facility.create({
    data: {
      organizationId: northstarOrg.id,
      name: 'Central Distribution',
      code: 'FAC-CD-02',
      facilityType: FacilityType.WAREHOUSE_LOGISTICS,
      address: '100 Industrial Parkway',
      city: 'Dallas',
      country: 'USA',
      timezone: 'America/Chicago',
      squareMeters: 45000,
      baselineKwhPerMonth: 160000,
      targetIntensityKwhM2: 102.0,
    },
  });

  const northCampus = await prisma.facility.create({
    data: {
      organizationId: northstarOrg.id,
      name: 'North Campus',
      code: 'FAC-NC-03',
      facilityType: FacilityType.COMMERCIAL_OFFICE,
      address: '450 Innovation Way',
      city: 'Boston',
      country: 'USA',
      timezone: 'America/New_York',
      squareMeters: 18200,
      baselineKwhPerMonth: 65000,
      targetIntensityKwhM2: 76.0,
    },
  });

  console.log('🏢 Seeded 3 core facilities: Westside Operations, Central Distribution, North Campus.');

  // 5. Create Asset Meters (Electricity Main, Solar PV, Wind Turbine, HVAC, Lighting)
  const westsideMain = await prisma.assetMeter.create({
    data: {
      facilityId: westside.id,
      name: 'Main Utility Incomer Meter',
      meterNumber: 'MTR-WSO-GRID-01',
      meterType: MeterType.ELECTRICITY_MAIN,
      status: MeterStatus.ACTIVE,
    },
  });

  const westsideSolar = await prisma.assetMeter.create({
    data: {
      facilityId: westside.id,
      name: 'Rooftop Solar PV Array 450kW',
      meterNumber: 'MTR-WSO-SOLAR-01',
      meterType: MeterType.SOLAR_PV,
      status: MeterStatus.ACTIVE,
    },
  });

  const westsideWind = await prisma.assetMeter.create({
    data: {
      facilityId: westside.id,
      name: 'On-site Wind Turbine Unit 1',
      meterNumber: 'MTR-WSO-WIND-01',
      meterType: MeterType.WIND_TURBINE,
      status: MeterStatus.ACTIVE,
    },
  });

  const centralMain = await prisma.assetMeter.create({
    data: {
      facilityId: centralDist.id,
      name: 'Central 13.8kV Primary Incomer',
      meterNumber: 'MTR-CD-GRID-01',
      meterType: MeterType.ELECTRICITY_MAIN,
      status: MeterStatus.ACTIVE,
    },
  });

  const northCampusHVAC = await prisma.assetMeter.create({
    data: {
      facilityId: northCampus.id,
      name: 'Central Chiller Plant HVAC Submeter',
      meterNumber: 'MTR-NC-HVAC-01',
      meterType: MeterType.HVAC,
      status: MeterStatus.ACTIVE,
    },
  });

  console.log('⚡ Seeded smart meters, solar arrays, and wind turbine meters.');

  // 6. Generate 7 Days of Historical Telemetry & Daily Rollups
  // Values align with landing page: 248 MWh total consumption, 64% renewables, 42.8 tCO2e carbon avoided
  const now = new Date();
  const dailyReadings = [];
  const rollups = [];

  for (let d = 7; d >= 0; d--) {
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() - d);
    targetDate.setHours(12, 0, 0, 0);

    const totalFacilityKwh = 11500 + Math.random() * 2000;
    const renewableKwh = totalFacilityKwh * 0.64; // 64% renewable mix
    const gridImportKwh = totalFacilityKwh - renewableKwh;
    const peakPowerKw = 480 + Math.random() * 40;
    const carbonAvoidedKg = renewableKwh * 0.42; // ~0.42 kg CO2e / kWh
    const estimatedCost = totalFacilityKwh * 0.13; // $0.13 / kWh average

    // Create 4 hourly snapshot readings for each day
    for (let h = 0; h < 24; h += 6) {
      const readingTime = new Date(targetDate);
      readingTime.setHours(h, 0, 0, 0);

      dailyReadings.push({
        meterId: westsideMain.id,
        facilityId: westside.id,
        timestamp: readingTime,
        energyKwh: totalFacilityKwh / 4,
        activePowerKw: peakPowerKw * (0.6 + Math.random() * 0.4),
        renewableKwh: renewableKwh / 4,
        gridImportKwh: gridImportKwh / 4,
        gridExportKwh: 15.0,
        voltage: 480.2,
        powerFactor: 0.94 + Math.random() * 0.04,
      });
    }

    rollups.push({
      facilityId: westside.id,
      date: targetDate,
      totalKwh: totalFacilityKwh,
      peakPowerKw,
      renewableKwh,
      gridImportKwh,
      gridExportKwh: 60.0,
      carbonAvoidedKg,
      energyCostEstimated: estimatedCost,
    });
  }

  await prisma.meterReading.createMany({ data: dailyReadings });
  await prisma.dailyEnergyRollup.createMany({ data: rollups });
  console.log(`📈 Seeded ${dailyReadings.length} telemetry readings and ${rollups.length} daily rollups.`);

  // 7. Energy Alerts
  await prisma.energyAlert.createMany({
    data: [
      {
        facilityId: westside.id,
        meterId: westsideMain.id,
        title: 'Peak Demand Spike Detected',
        description: 'Instantaneous demand reached 512 kW between 14:00 and 15:00, exceeding the 480 kW alert threshold.',
        severity: AlertSeverity.HIGH,
        status: AlertStatus.OPEN,
      },
      {
        facilityId: centralDist.id,
        meterId: centralMain.id,
        title: 'Power Factor Degradation',
        description: 'Power factor dropped below 0.88 on circuit line 3 for 4 consecutive hours.',
        severity: AlertSeverity.MEDIUM,
        status: AlertStatus.ACKNOWLEDGED,
      },
      {
        facilityId: northCampus.id,
        meterId: northCampusHVAC.id,
        title: 'Chiller Off-Hours Base-Load Creep',
        description: 'HVAC consumption was 18% higher than expected baseline between 00:00 and 05:00.',
        severity: AlertSeverity.LOW,
        status: AlertStatus.RESOLVED,
        resolvedById: superAdmin.id,
        resolvedAt: new Date(),
      },
    ],
  });

  // 8. Optimization Recommendations
  await prisma.optimizationRecommendation.createMany({
    data: [
      {
        facilityId: westside.id,
        title: 'Implement Smart Peak Shaving via Battery Storage',
        description: 'Dispatch on-site battery storage between 13:00 and 17:00 to shave peak grid draw during high-demand utility tariff windows.',
        category: OptimizationCategory.PEAK_SHAVING,
        potentialSavingsKwh: 34000,
        potentialSavingsUsd: 8400,
        carbonReductionTons: 14.2,
        status: OptimizationStatus.IN_PROGRESS,
      },
      {
        facilityId: centralDist.id,
        title: 'HVAC Night-Setback Schedule Optimization',
        description: 'Recalibrate automated thermostat setpoints to 76°F during non-operational warehouse shift hours.',
        category: OptimizationCategory.EQUIPMENT_EFFICIENCY,
        potentialSavingsKwh: 22000,
        potentialSavingsUsd: 3100,
        carbonReductionTons: 9.2,
        status: OptimizationStatus.IDENTIFIED,
      },
      {
        facilityId: northCampus.id,
        title: 'Power Factor Correction Capacitor Banks',
        description: 'Install low-voltage capacitor banks on main switchboard to correct power factor to 0.98 and avoid utility penalty surcharges.',
        category: OptimizationCategory.POWER_FACTOR_CORRECTION,
        potentialSavingsKwh: 12000,
        potentialSavingsUsd: 2250,
        carbonReductionTons: 5.1,
        status: OptimizationStatus.IMPLEMENTED,
      },
    ],
  });

  // 9. Utility Invoices
  await prisma.utilityInvoice.create({
    data: {
      facilityId: westside.id,
      invoiceNumber: 'INV-COMED-2026-08',
      utilityProvider: 'Commonwealth Edison (ComEd)',
      billingPeriodStart: new Date('2026-08-01T00:00:00Z'),
      billingPeriodEnd: new Date('2026-08-31T23:59:59Z'),
      totalKwh: 248000,
      peakDemandKw: 495,
      totalAmount: 32400.0,
      currency: 'USD',
      status: InvoiceStatus.VERIFIED,
      verifiedKwhDifference: -420, // Only 0.17% discrepancy with smart meter measurements!
      notes: 'Billed consumption verified against GreenGrid primary incomer telemetry. Variance within acceptable 0.5% tolerance.',
    },
  });

  // 10. Landing Page Leads
  await prisma.leadInquiry.createMany({
    data: [
      {
        fullName: 'Marcus Vance',
        workEmail: 'm.vance@everfieldlogistics.example',
        companyName: 'Everfield Logistics',
        facilityCount: 14,
        estimatedSpend: '$500k - $1M / year',
        notes: 'Interested in portfolio-wide renewable tracking and utility invoice verification.',
        status: LeadStatus.DEMO_SCHEDULED,
      },
      {
        fullName: 'Elena Rostova',
        workEmail: 'elena@solstice-energy.example',
        companyName: 'Solstice Industrial',
        facilityCount: 6,
        estimatedSpend: '$250k - $500k / year',
        notes: 'Requested live demo of wind turbine and DER real-time monitoring.',
        status: LeadStatus.NEW,
      },
    ],
  });

  console.log('✅ GreenGrid database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
