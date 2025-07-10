const mongoose = require('mongoose');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { Faker, en } = require('@faker-js/faker'); // Correct import for faker v8+
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: require('path').resolve(__dirname, '../config/config.env') });

// Mongoose models
const User = require('../models/User');
const ClassType = require('../models/ClassType');
const Facility = require('../models/Facility');
const ScheduledClass = require('../models/ScheduledClass');
const Plan = require('../models/Plan');
const TrainerProfile = require('../models/TrainerProfile');
const Booking = require('../models/Booking');

// Initialize Faker
const faker = new Faker({ locale: [en] });

// --- Sample Data Definitions (can be expanded) ---
const samplePlanNames = ["Basic Fit", "Pro Max", "Ultimate Warrior", "Student Pass", "Weekend Only"];
const sampleClassTypeNames = ["Yoga Flow", "HIIT Blast", "Spin Power", "Zumba Party", "Strength Circuit", "Pilates Core", "Kickboxing Fury"];
const sampleFacilityTypes = ["Gym Floor", "Yoga Studio", "Spin Room", "Cardio Zone", "Weightlifting Area", "Swimming Pool", "Squash Court"];
const sampleSpecializations = ["Weightlifting", "Yoga", "Cardio Fitness", "Rehabilitation", "Pilates", "Group Fitness", "Nutrition"];
const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];


const argv = yargs(hideBin(process.argv))
  .option('clear', {
    alias: 'c',
    type: 'boolean',
    description: 'Clear existing data from relevant collections before seeding',
    default: false,
  })
  .option('numMembers', { type: 'number', description: 'Number of member users to create', default: 10 })
  .option('numTrainers', { type: 'number', description: 'Number of trainer users to create', default: 3 })
  .option('numAdmins', { type: 'number', description: 'Number of admin users to create', default: 1 })
  .option('numClassTypes', { type: 'number', description: 'Number of class types to create', default: 5 })
  .option('numFacilities', { type: 'number', description: 'Number of facilities to create', default: 3 })
  .option('numScheduledClasses', { type: 'number', description: 'Number of scheduled classes per class type (approx)', default: 2 })
  .option('numPlans', { type: 'number', description: 'Number of membership plans to create', default: 3 })
  .option('numBookingsPerFacility', { type: 'number', description: 'Number of bookings per facility (approx)', default: 5 })
  .option('numAttendeesPerClass', { type: 'number', description: 'Max number of attendees to add per class (randomly up to this number)', default: 5 })
  .help()
  .alias('help', 'h')
  .argv;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected for Seeding: ${conn.connection.host}`);
  } catch (err) {
    console.error(`Error connecting to MongoDB: ${err.message}`);
    process.exit(1); // Exit process with failure
  }
};

// --- Data Generation Functions ---

// Note: The clearDatabase function was removed as its logic is now directly in runSeed.

const generateUsers = (count, role, existingPlans = []) => {
  const users = [];
  for (let i = 0; i < count; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const username = faker.internet.userName({ firstName, lastName }).toLowerCase() + `_${i}`;
    const email = faker.internet.email({ firstName, lastName, provider: 'example.com' }).toLowerCase();

    const user = {
      username,
      email,
      password: 'password123', // Plain text, will be hashed by User model pre-save hook
      role,
      firstName,
      lastName,
      isActive: true,
      membershipPlan: role === 'member' && existingPlans.length > 0
                      ? faker.helpers.arrayElement(existingPlans)._id
                      : null,
    };
    users.push(user);
  }
  return users;
};

const generatePlans = (count) => {
  const plans = [];
  for (let i = 0; i < count; i++) {
    plans.push({
      name: faker.helpers.arrayElement(samplePlanNames) + ` ${faker.string.alphanumeric(3)}`,
      description: faker.lorem.sentence(),
      price: faker.commerce.price({ min: 10, max: 200, dec: 0 }),
      duration: faker.helpers.arrayElement([30, 90, 365]), // days
      features: [faker.lorem.words(3), faker.lorem.words(4), faker.lorem.words(2)],
      isActive: true,
    });
  }
  return plans;
};

const generateClassTypes = (count) => {
  const classTypes = [];
  const usedNames = new Set();
  for (let i = 0; i < count; i++) {
    let name = faker.helpers.arrayElement(sampleClassTypeNames);
    while(usedNames.has(name) && usedNames.size < sampleClassTypeNames.length) { // ensure unique name if possible
        name = faker.helpers.arrayElement(sampleClassTypeNames);
    }
    usedNames.add(name);

    classTypes.push({
      name: name + (usedNames.size > sampleClassTypeNames.length ? ` ${faker.string.alphanumeric(2)}` : ''), // add suffix if names exhausted
      description: faker.lorem.paragraph(),
      defaultDurationMinutes: faker.helpers.arrayElement([30, 45, 60, 90]),
      requiredEquipment: faker.helpers.arrayElements(['Yoga Mat', 'Dumbbells', 'Spin Bike', 'Resistance Bands'], faker.number.int({min:0, max: 3})),
      isActive: true,
    });
  }
  return classTypes;
};

const generateFacilities = (count) => {
  const facilities = [];
  for (let i = 0; i < count; i++) {
    const operatingHours = [];
    const today = new Date();
    for (const day of faker.helpers.arrayElements(daysOfWeek, faker.number.int({ min: 3, max: 7 }))) {
        const openHour = faker.number.int({ min: 6, max: 10 });
        const closeHour = faker.number.int({ min: 18, max: 22 });
        operatingHours.push({
            dayOfWeek: day,
            openTime: `${String(openHour).padStart(2, '0')}:00`,
            closeTime: `${String(closeHour).padStart(2, '0')}:00`,
        });
    }
    facilities.push({
      name: `${faker.company.buzzNoun()} ${faker.helpers.arrayElement(sampleFacilityTypes)} ${i + 1}`,
      description: faker.lorem.sentences(2),
      type: faker.helpers.arrayElement(sampleFacilityTypes),
      capacity: faker.number.int({ min: 1, max: 100 }),
      status: 'Available',
      operatingHours,
      bookingType: faker.helpers.arrayElement(['hourly', 'slot_based']),
      slotDurationMinutes: faker.helpers.arrayElement([30, 60, 90]),
      maxBookingLengthSlots: faker.number.int({ min: 1, max: 4 }),
      bookingLeadTimeDays: faker.number.int({ min: 0, max: 14 }),
      isActive: true,
    });
  }
  return facilities;
};

const generateTrainerProfiles = (trainerUsers) => {
  const profiles = [];
  for (const trainer of trainerUsers) {
    const availability = [];
    for (const day of faker.helpers.arrayElements(daysOfWeek, faker.number.int({ min: 2, max: 5 }))) {
        const startHour = faker.number.int({ min: 7, max: 12 });
        const endHour = faker.number.int({ min: 14, max: 20 });
         availability.push({
            dayOfWeek: day,
            startTime: `${String(startHour).padStart(2, '0')}:00`,
            endTime: `${String(endHour).padStart(2, '0')}:00`,
        });
    }
    profiles.push({
      user: trainer._id,
      specializations: faker.helpers.arrayElements(sampleSpecializations, faker.number.int({ min: 1, max: 3 })),
      bio: faker.lorem.paragraph(),
      availability,
    });
  }
  return profiles;
};

const generateScheduledClasses = (countPerType, createdClassTypes, createdTrainers, createdFacilities) => {
  if (!createdClassTypes.length || !createdTrainers.length || !createdFacilities.length) {
    console.warn('Cannot generate scheduled classes: missing class types, trainers, or facilities.');
    return [];
  }
  const scheduledClasses = [];
  for (const classType of createdClassTypes) {
    for (let i = 0; i < countPerType; i++) {
      const trainer = faker.helpers.arrayElement(createdTrainers);
      const facility = faker.helpers.arrayElement(createdFacilities);
      const startDate = faker.date.soon({ days: 30 }); // Schedule within next 30 days
      const durationMinutes = classType.defaultDurationMinutes || 60;
      const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

      scheduledClasses.push({
        classType: classType._id,
        trainer: trainer._id,
        facility: facility._id,
        startTime: startDate,
        endTime: endDate,
        capacity: faker.number.int({ min: 5, max: facility.capacity > 30 ? 30 : facility.capacity }),
        attendees: [], // Will be populated after class creation by another function
        status: 'Scheduled',
        isRecurring: false,
      });
    }
  }
  return scheduledClasses;
};


// Main seeding logic will go into seedData function using these generators
const seedData = async () => {
  console.log('Starting data seeding process...');
  console.log('Arguments received:', argv);

  // 1. Generate Plans
  const planData = generatePlans(argv.numPlans);
  const plans = await Plan.insertMany(planData);
  console.log(`${plans.length} plans created.`);

  // 2. Generate Users (Admins, Trainers, Members)
  const adminData = generateUsers(argv.numAdmins, 'admin');
  const admins = await User.insertMany(adminData);
  console.log(`${admins.length} admin users created.`);

  const trainerData = generateUsers(argv.numTrainers, 'trainer');
  const trainers = await User.insertMany(trainerData);
  console.log(`${trainers.length} trainer users created.`);

  const memberData = generateUsers(argv.numMembers, 'member', plans); // Pass created plans
  const members = await User.insertMany(memberData);
  console.log(`${members.length} member users created.`);

  // 3. Generate Trainer Profiles
  if (trainers.length > 0) {
    const trainerProfileData = generateTrainerProfiles(trainers);
    const trainerProfiles = await TrainerProfile.insertMany(trainerProfileData);
    console.log(`${trainerProfiles.length} trainer profiles created.`);
  }

  // 4. Generate Class Types
  const classTypeData = generateClassTypes(argv.numClassTypes);
  const classTypes = await ClassType.insertMany(classTypeData);
  console.log(`${classTypes.length} class types created.`);

  // 5. Generate Facilities
  const facilityData = generateFacilities(argv.numFacilities);
  const facilities = await Facility.insertMany(facilityData);
  console.log(`${facilities.length} facilities created.`);

  // 6. Generate Scheduled Classes
  if (classTypes.length && trainers.length && facilities.length) {
    const scheduledClassData = generateScheduledClasses(argv.numScheduledClasses, classTypes, trainers, facilities);
    const scheduledClasses = await ScheduledClass.insertMany(scheduledClassData);
    console.log(`${scheduledClasses.length} scheduled classes created.`);

    // 7. Generate some attendees for these scheduled classes
    if (scheduledClasses.length > 0 && members.length > 0) {
      for (const sClass of scheduledClasses) {
        const numAttendeesToAssign = faker.number.int({ min: 0, max: Math.min(argv.numAttendeesPerClass, sClass.capacity) });
        const potentialAttendees = faker.helpers.arrayElements(members, numAttendeesToAssign);

        sClass.attendees = potentialAttendees.map(att => att._id);
        if (sClass.attendees.length === sClass.capacity) {
            sClass.status = 'Full';
        }
        await sClass.save(); // Save each class individually after updating attendees
      }
      console.log(`Attendees added to scheduled classes.`);
    }

  } else {
    console.log('Skipping scheduled class and attendee generation due to missing prerequisites.');
  }

  // 8. Generate some Facility Bookings
  if (facilities.length > 0 && members.length > 0) {
    const bookingData = [];
    for (const facility of facilities) {
      for (let i = 0; i < argv.numBookingsPerFacility; i++) {
        const member = faker.helpers.arrayElement(members);
        // Ensure booking is within facility operating hours and future
        // This is simplified; a robust version would check existing bookings for conflicts
        let bookingStartTime, bookingEndTime;
        let attempts = 0;
        let validSlotFound = false;

        while(attempts < 10 && !validSlotFound) {
            const dayOffset = faker.number.int({min:1, max: facility.bookingLeadTimeDays}); // Book for tomorrow onwards
            bookingStartTime = faker.date.soon({days: dayOffset});

            const dayOfWeekStr = daysOfWeek[bookingStartTime.getDay() === 0 ? 6 : bookingStartTime.getDay() -1]; // Sunday is 0 for getDay()
            const operatingDay = facility.operatingHours.find(oh => oh.dayOfWeek === dayOfWeekStr);

            if(operatingDay) {
                const [openH, openM] = operatingDay.openTime.split(':').map(Number);
                const [closeH, closeM] = operatingDay.closeTime.split(':').map(Number);

                bookingStartTime.setHours(faker.number.int({min: openH, max: closeH -1 }), faker.helpers.arrayElement([0, 15, 30, 45]));

                const durationSlots = faker.number.int({min: 1, max: facility.maxBookingLengthSlots});
                bookingEndTime = new Date(bookingStartTime.getTime() + durationSlots * facility.slotDurationMinutes * 60000);

                const facilityCloseDateTime = new Date(bookingStartTime);
                facilityCloseDateTime.setHours(closeH, closeM, 0, 0);

                if (bookingEndTime <= facilityCloseDateTime && bookingStartTime > new Date()) {
                     validSlotFound = true;
                }
            }
            attempts++;
        }

        if(validSlotFound) {
            bookingData.push({
                user: member._id,
                facility: facility._id,
                startTime: bookingStartTime,
                endTime: bookingEndTime,
                status: 'Confirmed',
                notes: faker.lorem.sentence(),
            });
        }
      }
    }
    if(bookingData.length > 0){
        await Booking.insertMany(bookingData);
        console.log(`${bookingData.length} facility bookings created.`);
    } else {
        console.log('No valid facility booking slots found to create bookings.');
    }
  } else {
      console.log('Skipping facility booking generation due to missing facilities or members.');
  }

  console.log('Data seeding fully implemented.');
};


const runSeed = async () => {
  await connectDB();
  if (argv.clear) {
    console.log('Clearing the database...');
    await Booking.deleteMany({}); // Clear bookings first
    await ScheduledClass.deleteMany({});
    await TrainerProfile.deleteMany({});
    await User.deleteMany({}); // Users before profiles, plans etc. if they hold refs
    await Plan.deleteMany({}); // Plans might be referenced by Users
    await ClassType.deleteMany({});
    await Facility.deleteMany({});
    console.log('Relevant collections cleared.');
  }

  await seedData();

  console.log('Seed script finished successfully.');
  await mongoose.disconnect();
  console.log('MongoDB disconnected.');
  process.exit(0);
};

runSeed().catch(error => {
  console.error('Error during seeding process:', error);
  mongoose.disconnect();
  process.exit(1);
});
