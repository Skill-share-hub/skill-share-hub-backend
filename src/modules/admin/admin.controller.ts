import { getAllTutorsService, getAllEnrollmentsService, getEnrollmentByIdService } from "./admin.service";

export const getAllTutors = async (req: any, res: any, next: any) => {
  try {

    const query = req.query;

    const result = await getAllTutorsService(query);

    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    next(error);
  }
};

export const getAllEnrollments = async (req: any, res: any, next: any) => {
  try {
    const query = req.query;
    const result = await getAllEnrollmentsService(query);
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getEnrollmentById = async (req: any, res: any, next: any) => {
  try {
    const { id } = req.params;
    const result = await getEnrollmentByIdService(id);
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};