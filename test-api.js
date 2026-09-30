// Import functions from the apiClient.js file
const userService = require('./services/apiClient');

async function runTests() {
  try {
    console.log("1. Sending creation request");
    // Use the createUser function with dynamic data
    const newUser = {
      nom: "Test Verification",
      email: `test.${Date.now()}@example.com`,
      height: 180,
      weight: 75
    };
    const response = await userService.createUser(newUser);
    const userId = response.data.data._id;
    console.log(`User created; MongoDB ID: ${userId}\n`);

    console.log("2. Adding workout");
    await userService.addWorkout(userId, {
      type: "Swimming",
      duree: 45,
      distance: 1500
    });
    console.log("Workout added\n");

    console.log("3. Retrieving user's workouts");
    const workoutsResponse = await userService.getWorkouts(userId);
    console.log("Workouts retrieved:", workoutsResponse.data);

    console.log("\n4. Retrieving user data");
    const userResponse = await userService.getUserById(userId);
    console.log("Retrieved user data:", userResponse.data);

    console.log("\n5. Updating user profile");
    const updateResponse = await userService.updateUser(userId, { weight: 78 });
    console.log("User weight updated:", updateResponse.data);

    console.log("\n6. Retrieving all users");
    const allUsersResponse = await userService.getAllUsers();
    const userCount = allUsersResponse.data.data ? allUsersResponse.data.data.length : 'Multiple';
    console.log(`Total users currently in the database: ${userCount}\n`);

    console.log("7. Creating a temporary user to test DELETE");
    const tempUser = {
      nom: "Temporary User",
      email: `temp.${Date.now()}@example.com`,
      height: 170,
      weight: 60
    };
    const tempResponse = await userService.createUser(tempUser);
    const tempUserId = tempResponse.data.data._id;
    console.log(`Temporary user created; MongoDB ID: ${tempUserId}\n`);

    console.log("8. Deleting the temporary user");
    await userService.deleteUser(tempUserId);
    console.log(`Temporary user (${tempUserId}) successfully deleted!\n`);

    console.log("All endpoints tested successfully! (Main test user kept in DB for manual inspection)");

  } catch (error) {
    console.error("❌ Error during execution:", error.response?.data || error.message);
  }
}

// Run the function
runTests();