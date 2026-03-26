import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load env
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/skill-share-hub';

async function verify() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const User = mongoose.model('User', new mongoose.Schema({
      role: String,
      enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment' }]
    }));

    // Find any tutor
    const tutor = await User.findOne({ role: 'tutor' });
    if (!tutor) {
      console.log('No tutor found.');
    } else {
      console.log(`Found tutor: ${tutor._id}. Enrolled in ${tutor.enrolledCourses.length} courses.`);
      console.log('Enrollment IDs:', tutor.enrolledCourses);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

verify();
