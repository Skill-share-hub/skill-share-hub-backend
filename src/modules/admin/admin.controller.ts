import { getAllTutorsService } from "./admin.service";

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