import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/skill-share-hub';

async function cleanup() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const User = mongoose.model('User', new mongoose.Schema({
      enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment' }]
    }));

    const Enrollment = mongoose.model('Enrollment', new mongoose.Schema({
      userId: mongoose.Schema.Types.ObjectId,
      courseId: mongoose.Schema.Types.ObjectId
    }));

    const users = await User.find({});
    console.log(`Processing ${users.length} users...`);

    for (const user of users) {
      let updated = false;
      const newEnrolledCourses = [];

      for (const enrolledId of user.enrolledCourses) {
        console.log(`Checking ID ${enrolledId} for user ${user._id}`);
        // Check if this ID belongs to an Enrollment
        const enrollment = await Enrollment.findById(enrolledId);
        
        if (enrollment) {
          console.log(`ID ${enrolledId} is a valid Enrollment.`);
          newEnrolledCourses.push(enrolledId);
        } else {
          console.log(`ID ${enrolledId} is NOT an Enrollment ID. Checking if it's a Course ID...`);
          
          const actualEnrollment = await Enrollment.findOne({
            userId: user._id,
            courseId: enrolledId
          });

          if (actualEnrollment) {
            console.log(`Found actual enrollment ${actualEnrollment._id} for course ${enrolledId}. Fixing...`);
            newEnrolledCourses.push(actualEnrollment._id);
            updated = true;
          } else {
            console.log(`No enrollment found for course ${enrolledId}. Removing corrupt entry.`);
            updated = true;
          }
        }
      }

      if (updated) {
        await User.findByIdAndUpdate(user._id, { enrolledCourses: newEnrolledCourses });
        console.log(`User ${user._id} updated.`);
      }
    }

    console.log('Cleanup complete.');
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error during cleanup:', err);
  }
}

cleanup();
