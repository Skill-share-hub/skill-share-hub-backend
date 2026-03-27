import { Request, Response } from "express";
import * as PremiumApplicationService from "./premiumApplication.service";

export const submitApplication = async (req: Request, res: Response) => {
  try {
    const files = req.files as {
      documents?: Express.MulterS3.File[];
    };

    if (!files.documents || files.documents.length === 0) {
      return res.status(422).json({
        success: false,
        message: "At least one certificate is required.",
      });
    }

    const documents = files.documents.map((file, index) => ({
      url: file.location,
      s3Key: file.key,
      fileName: file.originalname,
      fileType: Array.isArray(req.body.fileTypes)
        ? req.body.fileTypes[index]
        : req.body.fileTypes ?? "other",
    }));


    const application = await PremiumApplicationService.submitApplication({
      tutorId: req.user._id,
      ...req.body,
      documents,
    });

    res.status(201).json({ success: true, data: application });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getApplicationStatus = async (req: Request, res: Response) => {
  try {
    const application = await PremiumApplicationService.getApplicationStatus(
      req.user._id
    );
    res.status(200).json({ success: true, data: application });
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const deleteApplication = async (req: Request, res: Response) => {
  try {
    const result = await PremiumApplicationService.deleteApplication(
      req.params.id,
      req.user._id
    );
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const resubmitApplication = async (req: Request, res: Response) => {
  try {
    const application = await PremiumApplicationService.resubmitApplication(
      req.params.id,
      { tutorId: req.user._id, ...req.body } 
    );
    res.status(201).json({ success: true, data: application });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};


//Admin

export const getAllApplications = async (req: Request, res: Response) => {
  try {
    const {page,limit,status,
      search,sortBy,sortOrder,} = req.query;

    const result = await PremiumApplicationService.getAllApplications({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      status: status as any,
      search: search as string,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any,
    });

    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getApplicationById = async (req: Request, res: Response) => {
  try {
    const application = await PremiumApplicationService.getApplicationById(
      req.params.id
    );
    res.status(200).json({ success: true, data: application });
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const approveApplication = async (req: Request, res: Response) => {
  try {
    const application = await PremiumApplicationService.approveApplication(
      req.user._id,
      req.params.id as string
    );
    res.status(200).json({ success: true, data: application });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const rejectApplication = async (req: Request, res: Response) => {
  try {
    const { rejectionReason } = req.body;
    if (!rejectionReason) {
      return res.status(422).json({
        success: false,
        message: "Rejection reason is required.",
      });
    }

    const application = await PremiumApplicationService.rejectApplication(
      req.user._id,
      req.params.id,
      rejectionReason
    );
    res.status(200).json({ success: true, data: application });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};