import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load env
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/skill-share-hub';

async function check() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const User = mongoose.model('User', new mongoose.Schema({
      name: String,
      enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment' }]
    }));

    const Enrollment = mongoose.model('Enrollment', new mongoose.Schema({
      userId: mongoose.Schema.Types.ObjectId,
      courseId: mongoose.Schema.Types.ObjectId
    }));

    const courseId = '69aed518824075c29fd5faa3';
    
    // Find users enrolled in this course
    const enrollments = await Enrollment.find({ courseId });
    console.log(`Found ${enrollments.length} enrollments for course ${courseId}`);

    for (const en of enrollments) {
      const user = await User.findById(en.userId);
      if (user) {
        const isLinked = user.enrolledCourses.some(id => String(id) === String(en._id));
        console.log(`User ${user.name} (${user._id}): Enrollment ${en._id} linked: ${isLinked}`);
        if (!isLinked) {
          console.log(`FIXING: Linking enrollment ${en._id} to user ${user.name}`);
          await User.findByIdAndUpdate(user._id, { $addToSet: { enrolledCourses: en._id } });
        }
      }
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

check();
