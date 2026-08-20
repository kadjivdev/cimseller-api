import prisma from "../../config/prisma.js";
import seedRoles from "./rolesSeeder.js";
import seedPermissions from "./permissionsSeeder.js";
import seedTools from "./toolsSeeder.js";
import userSeeders from "./userSeeder.js";

const seedDatabase = async () => {
    try {
        await userSeeders(),
        await seedPermissions(),
        await seedRoles(),
        await seedTools(),
        // await Promise.all([
        //     userSeeders(),
        //     seedPermissions(),
        //     seedRoles(),
        //     seedTools(),
        // ]);

        console.log('Database seeding completed successfully.');
    } catch (error) {
        console.error('Error seeding database:', error);
    }
};

await seedDatabase();