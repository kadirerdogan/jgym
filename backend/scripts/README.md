# Database Seed Script

This script (`seedDb.js`) is used to populate the MongoDB database with sample data for development and testing purposes. It can generate various entities like users (admins, trainers, members), membership plans, class types, facilities, scheduled classes, trainer profiles, and bookings.

## Prerequisites

- Ensure you have Node.js and npm/yarn installed.
- A MongoDB instance must be running and accessible.
- The backend dependencies, including those needed for this script, should be installed by running `npm install` or `yarn install` in the `backend` directory. This script specifically uses:
    - `mongoose` for database interaction.
    - `yargs` for command-line argument parsing.
    - `@faker-js/faker` for generating realistic fake data.
    - `dotenv` for loading environment variables.

## Configuration

The script uses the same MongoDB connection URI (`MONGO_URI`) as the main application, defined in the `backend/config/config.env` file. Make sure this file exists and `MONGO_URI` is correctly set.

Example `backend/config/config.env`:
```
NODE_ENV=development
PORT=5001
MONGO_URI=mongodb://localhost:27017/your_gym_db_name
JWT_SECRET=yourjwtsecret
JWT_EXPIRE=30d
```

## Usage

Navigate to the `backend` directory in your terminal. You can run the script using Node.js:

```bash
node scripts/seedDb.js [options]
```

### Available Options

The script supports several command-line options to customize the data generation:

-   `--clear` (alias `-c`):
    -   Type: Boolean
    -   Default: `false`
    -   Description: If set, the script will clear existing data from the relevant collections (Users, Plans, ClassTypes, Facilities, ScheduledClasses, TrainerProfiles, Bookings) before seeding new data.
    -   Example: `node scripts/seedDb.js --clear`

-   `--numMembers <number>`:
    -   Type: Number
    -   Default: `10`
    -   Description: Specifies the number of member users to create.
    -   Example: `node scripts/seedDb.js --numMembers 50`

-   `--numTrainers <number>`:
    -   Type: Number
    -   Default: `3`
    -   Description: Specifies the number of trainer users to create (TrainerProfiles will also be generated for them).
    -   Example: `node scripts/seedDb.js --numTrainers 5`

-   `--numAdmins <number>`:
    -   Type: Number
    -   Default: `1`
    -   Description: Specifies the number of admin users to create.
    -   Example: `node scripts/seedDb.js --numAdmins 2`

-   `--numClassTypes <number>`:
    -   Type: Number
    -   Default: `5`
    -   Description: Specifies the number of class types to create.
    -   Example: `node scripts/seedDb.js --numClassTypes 10`

-   `--numFacilities <number>`:
    -   Type: Number
    -   Default: `3`
    -   Description: Specifies the number of facilities to create.
    -   Example: `node scripts/seedDb.js --numFacilities 5`

-   `--numScheduledClasses <number>`:
    -   Type: Number
    -   Default: `2`
    -   Description: Specifies the approximate number of scheduled classes to create *per class type*.
    -   Example: `node scripts/seedDb.js --numScheduledClasses 3`

-   `--numPlans <number>`:
    -   Type: Number
    -   Default: `3`
    -   Description: Specifies the number of membership plans to create.
    -   Example: `node scripts/seedDb.js --numPlans 5`

-   `--numBookingsPerFacility <number>`:
    -   Type: Number
    -   Default: `5`
    -   Description: Specifies the approximate number of facility bookings to create *per facility*.
    -   Example: `node scripts/seedDb.js --numBookingsPerFacility 10`

-   `--numAttendeesPerClass <number>`:
    -   Type: Number
    -   Default: `5`
    -   Description: Specifies the maximum number of attendees to randomly assign to each scheduled class (up to the class's capacity).
    -   Example: `node scripts/seedDb.js --numAttendeesPerClass 3`

-   `--help` (alias `-h`):
    -   Displays the help message listing all available options.

### Examples

1.  **Seed with default values, clearing the database first:**
    ```bash
    node scripts/seedDb.js --clear
    ```

2.  **Seed a larger amount of data without clearing:**
    ```bash
    node scripts/seedDb.js --numMembers 100 --numTrainers 10 --numFacilities 10 --numClassTypes 15 --numScheduledClasses 5 --numBookingsPerFacility 8 --numAttendeesPerClass 10
    ```

3.  **Only seed a few specific items (other counts will use defaults):**
    ```bash
    node scripts/seedDb.js --numAdmins 0 --numPlans 1
    ```

## Output

The script will log its progress to the console, indicating which collections are being cleared (if applicable) and how many documents are created for each model. It will also report any errors encountered during the process. Upon successful completion, it will disconnect from the database.
