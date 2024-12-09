import { Request, Response } from 'express';
import { Application, ApplicationStatus } from '../models/Application';
import { Job, JobStatus } from '../models/Job';
import { User } from '../models/User';
import { uploadToS3 } from '../utils/s3';
import { emailService } from '../services/emailService';

interface AuthenticatedRequest extends Request {
  user: {
    _id: string;
    role: string;
  };
  files?: {
    resume?: Express.Multer.File;
    additionalDocuments?: Express.Multer.File | Express.Multer.File[];
  };
}

export const createApplication = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { jobId } = req.params;
    const applicantId = req.user._id;

    // Check if job exists and is still open
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    if (job.status !== JobStatus.PUBLISHED) {
      return res.status(400).json({ message: 'This job is no longer accepting applications' });
    }

    // Check if user has already applied
    const existingApplication = await Application.findOne({ job: jobId, applicant: applicantId });
    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    // Upload resume and additional documents to S3
    const resumeFile = req.files?.resume;
    if (!resumeFile) {
      return res.status(400).json({ message: 'Resume is required' });
    }

    const resumeUrl = await uploadToS3(resumeFile, 'resumes');
    const additionalDocs = [];

    if (req.files?.additionalDocuments) {
      const docs = Array.isArray(req.files.additionalDocuments) 
        ? req.files.additionalDocuments 
        : [req.files.additionalDocuments];
      
      for (const doc of docs) {
        const url = await uploadToS3(doc, 'additional-documents');
        additionalDocs.push({
          url,
          filename: doc.originalname,
          type: doc.mimetype,
        });
      }
    }

    const application = new Application({
      job: jobId,
      applicant: applicantId,
      status: ApplicationStatus.PENDING,
      coverLetter: req.body.coverLetter,
      resume: {
        url: resumeUrl,
        filename: resumeFile.originalname,
      },
      additionalDocuments: additionalDocs,
      expectedSalary: req.body.expectedSalary,
      availability: req.body.availability,
      experience: req.body.experience,
      questions: req.body.questions,
      statusHistory: [{
        status: ApplicationStatus.PENDING,
        timestamp: new Date(),
        updatedBy: applicantId,
      }],
    });

    await application.save();

    // Update job application count
    await Job.findByIdAndUpdate(jobId, { $inc: { applicationCount: 1 } });

    // Send confirmation email to applicant
    const applicant = await User.findById(applicantId);
    if (applicant?.email) {
      await emailService.sendApplicationStatusEmail(
        applicant.email,
        applicant.name,
        job.title,
        ApplicationStatus.PENDING
      );
    }

    res.status(201).json(application);
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({ message: 'Error creating application' });
  }
};

export const getApplicationById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('job')
      .populate('applicant', '-password')
      .populate('statusHistory.updatedBy', 'name email');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user has permission to view this application
    if (
      req.user.role !== 'admin' &&
      application.applicant._id.toString() !== req.user._id &&
      (application.job as any).employer.toString() !== req.user._id
    ) {
      return res.status(403).json({ message: 'Unauthorized to view this application' });
    }

    res.json(application);
  } catch (error) {
    console.error('Error getting application:', error);
    res.status(500).json({ message: 'Error getting application' });
  }
};

export const updateApplicationStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const application = await Application.findById(id).populate('job applicant');
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user has permission to update this application
    if (
      req.user.role !== 'admin' &&
      (application.job as any).employer.toString() !== req.user._id
    ) {
      return res.status(403).json({ message: 'Unauthorized to update this application' });
    }

    application.status = status;
    application.statusHistory.push({
      status,
      timestamp: new Date(),
      updatedBy: req.user._id,
      notes,
    });

    await application.save();

    // Send email notification
    if (application.applicant && (application.applicant as any).email) {
      await emailService.sendApplicationStatusEmail(
        (application.applicant as any).email,
        (application.applicant as any).name,
        (application.job as any).title,
        status
      );
    }

    res.json(application);
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ message: 'Error updating application status' });
  }
};

export const withdrawApplication = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const application = await Application.findById(id).populate('job');
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user has permission to withdraw this application
    if (application.applicant.toString() !== req.user._id) {
      return res.status(403).json({ message: 'Unauthorized to withdraw this application' });
    }

    // Check if application can be withdrawn
    if (application.status === ApplicationStatus.WITHDRAWN) {
      return res.status(400).json({ message: 'Application is already withdrawn' });
    }
    if (application.status === ApplicationStatus.ACCEPTED) {
      return res.status(400).json({ message: 'Cannot withdraw an accepted application' });
    }

    application.status = ApplicationStatus.WITHDRAWN;
    application.withdrawalReason = reason;
    application.statusHistory.push({
      status: ApplicationStatus.WITHDRAWN,
      timestamp: new Date(),
      updatedBy: req.user._id,
      notes: reason,
    });

    await application.save();

    // Decrement job application count
    await Job.findByIdAndUpdate(application.job, { $inc: { applicationCount: -1 } });

    res.json(application);
  } catch (error) {
    console.error('Error withdrawing application:', error);
    res.status(500).json({ message: 'Error withdrawing application' });
  }
};

export const getApplicationsByJob = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { jobId } = req.params;
    const { status, sort = '-createdAt' } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user has permission to view applications for this job
    if (
      req.user.role !== 'admin' &&
      job.employer.toString() !== req.user._id
    ) {
      return res.status(403).json({ message: 'Unauthorized to view applications for this job' });
    }

    const query: any = { job: jobId };
    if (status) {
      query.status = status;
    }

    const applications = await Application.find(query)
      .populate('applicant', '-password')
      .populate('statusHistory.updatedBy', 'name email')
      .sort(sort);

    res.json(applications);
  } catch (error) {
    console.error('Error getting applications:', error);
    res.status(500).json({ message: 'Error getting applications' });
  }
};

export const getMyApplications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, sort = '-createdAt' } = req.body;

    const query: any = { applicant: req.user._id };
    if (status) {
      query.status = status;
    }

    const applications = await Application.find(query)
      .populate('job')
      .populate('statusHistory.updatedBy', 'name email')
      .sort(sort);

    res.json(applications);
  } catch (error) {
    console.error('Error getting applications:', error);
    res.status(500).json({ message: 'Error getting applications' });
  }
};
