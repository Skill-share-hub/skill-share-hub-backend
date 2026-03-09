export const getStudentDashboardData = async (userId:string) => {

   return {
        enrolledCourses:[],
        recommendedCourses:[],
        creditBalance:0
    }
}
export const getTutorDashboardData = async(userId:string) => {

    return {
        createdCourses:[],
        totalEnrollments:0,
        earnings :0
    }
}