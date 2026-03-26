import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load env
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/skill-share-hub';

async function fixTypo() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const Course = mongoose.model('Course', new mongoose.Schema({ title: String }));
    
    // Find all courses with "Devolpment" in the title
    const courses = await Course.find({ title: /Devolpment/i });
    console.log(`Found ${courses.length} courses with typo.`);

    for (const course of courses) {
      const oldTitle = course.title;
      const newTitle = oldTitle.replace(/Devolpment/gi, 'Development');
      await Course.findByIdAndUpdate(course._id, { title: newTitle });
      console.log(`Updated: "${oldTitle}" -> "${newTitle}"`);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

fixTypo();
