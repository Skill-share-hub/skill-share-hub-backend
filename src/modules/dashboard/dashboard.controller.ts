export const getStudentDashboard = (req, res) => {

    const enrolledCourses = []
    const recommendedCourses = []
    const creditBalance = 0

    res.json({
        enrolledCourses,
        recommendedCourses,
        creditBalance
    })
}
export const getTuterDashboard = (req, res) => {

    const createdCourses = []
    const totalEnrollments  = []
    const earnings  = 0

    res.json({
        createdCourses,
        totalEnrollments,
        earnings 
    })
}