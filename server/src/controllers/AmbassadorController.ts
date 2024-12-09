import { Request, Response, NextFunction } from 'express';
import { AmbassadorService } from '../services/AmbassadorService';
import { validateAmbassador } from '../validators/ambassadorValidator';
import { AppError, NotFoundError, BadRequestError } from '../utils/errors';
import { asyncHandler } from '../utils/asyncHandler';
import { IUser, IAmbassador } from '../types';

export class AmbassadorController {
  // Create new ambassador
  static createAmbassador = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const validatedData = await validateAmbassador(req.body);
      const ambassador = await AmbassadorService.createAmbassador({
        ...validatedData,
        userId: req.user.id,
      });
      
      res.status(201).json({
        success: true,
        data: ambassador,
      });
    }
  );

  // Get ambassador by ID
  static getAmbassadorById = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const ambassador = await AmbassadorService.getAmbassadorById(req.params.id);
      
      if (!ambassador) {
        throw new NotFoundError('Ambassador not found', 404);
      }

      res.status(200).json({
        success: true,
        data: ambassador,
      });
    }
  );

  // Update ambassador
  static updateAmbassador = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const validatedData = await validateAmbassador(req.body, true);
      const ambassador = await AmbassadorService.updateAmbassador(
        req.params.id,
        validatedData
      );

      res.status(200).json({
        success: true,
        data: ambassador,
      });
    }
  );

  // Delete ambassador
  static deleteAmbassador = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      await AmbassadorService.deleteAmbassador(req.params.id);

      res.status(204).json({
        success: true,
        data: null,
      });
    }
  );

  // Get all ambassadors with filtering and pagination
  static getAmbassadors = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const {
        page = 1,
        limit = 10,
        sort,
        status,
        verificationStatus,
        skills,
        availability,
      } = req.query;

      const result = await AmbassadorService.getAmbassadors({
        page: Number(page),
        limit: Number(limit),
        sort: sort as string,
        status: status as string,
        verificationStatus: verificationStatus as string,
        skills: skills ? (skills as string).split(',') : undefined,
        availability: availability as string,
      });

      res.status(200).json({
        success: true,
        data: result.ambassadors,
        pagination: {
          page: result.page,
          totalPages: result.totalPages,
          total: result.total,
        },
      });
    }
  );

  // Update verification status
  static updateVerificationStatus = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { status } = req.body;

      if (!['Unverified', 'Pending', 'Verified', 'Rejected'].includes(status)) {
        throw new BadRequestError('Invalid verification status', 400);
      }

      const ambassador = await AmbassadorService.updateVerificationStatus(
        req.params.id,
        status
      );

      res.status(200).json({
        success: true,
        data: ambassador,
      });
    }
  );

  // Update rating
  static updateRating = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { rating } = req.body;

      if (typeof rating !== 'number' || rating < 0 || rating > 5) {
        throw new BadRequestError('Invalid rating value', 400);
      }

      const ambassador = await AmbassadorService.updateRating(
        req.params.id,
        rating
      );

      res.status(200).json({
        success: true,
        data: ambassador,
      });
    }
  );

  // Increment completed jobs
  static incrementCompletedJobs = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const ambassador = await AmbassadorService.incrementCompletedJobs(
        req.params.id
      );

      res.status(200).json({
        success: true,
        data: ambassador,
      });
    }
  );

  // Get ambassador profile
  public static async getProfile(req: Request, res: Response): Promise<void> {
    const userId = (req.user as IUser)._id;
    const ambassador = await AmbassadorService.getAmbassadorByUserId(userId);

    if (!ambassador) {
      throw new NotFoundError('Ambassador profile not found');
    }

    res.json(ambassador);
  }

  // Update ambassador profile
  public static async updateProfile(req: Request, res: Response): Promise<void> {
    const userId = (req.user as IUser)._id;
    const ambassador = await AmbassadorService.getAmbassadorByUserId(userId);

    if (!ambassador) {
      throw new NotFoundError('Ambassador profile not found');
    }

    const updates: Partial<IAmbassador> = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      bio: req.body.bio,
      socialMedia: req.body.socialMedia,
      experience: req.body.experience,
      education: req.body.education,
      skills: req.body.skills,
      languages: req.body.languages,
      certifications: req.body.certifications
    };

    const updatedAmbassador = await AmbassadorService.updateAmbassadorProfile(
      ambassador._id,
      updates
    );

    res.json(updatedAmbassador);
  }

  // Upload verification documents
  public static async uploadVerificationDocuments(req: Request, res: Response): Promise<void> {
    const userId = (req.user as IUser)._id;
    const ambassador = await AmbassadorService.getAmbassadorByUserId(userId);

    if (!ambassador) {
      throw new NotFoundError('Ambassador profile not found');
    }

    if (!req.files || !Array.isArray(req.files)) {
      throw new BadRequestError('No files uploaded');
    }

    const documents = req.files.map(file => ({
      type: file.mimetype,
      url: file.path,
      status: 'Pending',
      uploadedAt: new Date()
    }));

    ambassador.verificationDocuments = [
      ...(ambassador.verificationDocuments || []),
      ...documents
    ];

    await ambassador.save();
    res.json(ambassador);
  }

  // Get verification status
  public static async getVerificationStatus(req: Request, res: Response): Promise<void> {
    const userId = (req.user as IUser)._id;
    const ambassador = await AmbassadorService.getAmbassadorByUserId(userId);

    if (!ambassador) {
      throw new NotFoundError('Ambassador profile not found');
    }

    res.json({
      status: ambassador.verificationStatus,
      documents: ambassador.verificationDocuments
    });
  }

  // Get statistics
  public static async getStats(req: Request, res: Response): Promise<void> {
    const userId = (req.user as IUser)._id;
    const ambassador = await AmbassadorService.getAmbassadorByUserId(userId);

    if (!ambassador) {
      throw new NotFoundError('Ambassador profile not found');
    }

    // Implement statistics gathering logic here
    const stats = {
      totalApplications: 0,
      acceptedApplications: 0,
      rejectedApplications: 0,
      pendingApplications: 0,
      // Add more stats as needed
    };

    res.json(stats);
  }
}

export default AmbassadorController;
