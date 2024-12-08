import { Request, Response, NextFunction } from 'express';
import { AmbassadorService } from '../services/AmbassadorService';
import { validateAmbassador } from '../validators/ambassadorValidator';
import { AppError } from '../utils/errors';
import { asyncHandler } from '../utils/asyncHandler';

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
        throw new AppError('Ambassador not found', 404);
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
        throw new AppError('Invalid verification status', 400);
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
        throw new AppError('Invalid rating value', 400);
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
}

export default AmbassadorController;
