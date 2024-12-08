import { Request, Response } from 'express';
import { Company, Job, VerificationCode } from '../models';
import { sendEmail, sendSMS, uploadToS3, generateVerificationCode } from '../utils';
import { CompanyStatus, JobStatus, NotificationType } from '../types';
import { createNotification } from './notification.controller';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../errors';

// Company Registration
export const registerCompany = async (req: Request, res: Response) => {
  const { companyName, contactName, email, phone, password } = req.body;

  // Check if company already exists
  const existingCompany = await Company.findOne({ email });
  if (existingCompany) {
    throw new BadRequestError('Company with this email already exists');
  }

  // Create company with pending status
  const company = new Company({
    name: companyName,
    contactName,
    email,
    phone,
    status: CompanyStatus.PENDING,
    verificationStatus: false,
  });

  await company.setPassword(password);
  await company.save();

  // Generate and save verification code
  const code = generateVerificationCode();
  const verificationCode = new VerificationCode({
    code,
    company: company._id,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
  });
  await verificationCode.save();

  // Send verification code
  try {
    await sendEmail(email, 'Verify Your Company Account', `Your verification code is: ${code}`);
  } catch (error) {
    console.error('Failed to send verification email:', error);
  }

  // Notify admin about new company registration
  await createNotification({
    type: NotificationType.NEW_COMPANY,
    recipient: 'admin',
    data: {
      companyId: company._id,
      companyName: company.name,
    },
  });

  res.status(201).json({
    message: 'Company registered successfully. Please verify your account.',
    companyId: company._id,
  });
};

export const verifyCompany = async (req: Request, res: Response) => {
  const { code, method, destination } = req.body;

  const verificationCode = await VerificationCode.findOne({
    code,
    expiresAt: { $gt: new Date() },
  }).populate('company');

  if (!verificationCode) {
    throw new BadRequestError('Invalid or expired verification code');
  }

  const company = verificationCode.company as any;
  if (
    (method === 'email' && company.email !== destination) ||
    (method === 'phone' && company.phone !== destination)
  ) {
    throw new BadRequestError('Invalid verification details');
  }

  // Update company verification status
  company.verificationStatus = true;
  await company.save();

  // Remove used verification code
  await verificationCode.remove();

  res.json({ message: 'Company verified successfully' });
};

// Company Management (Admin)
export const getCompanies = async (req: Request, res: Response) => {
  const { status, search } = req.query;
  const query: any = {};

  if (status && status !== 'all') {
    query.status = status;
  }

  if (search) {
    query.$or = [
      { name: new RegExp(search as string, 'i') },
      { email: new RegExp(search as string, 'i') },
      { contactName: new RegExp(search as string, 'i') },
    ];
  }

  const companies = await Company.find(query).sort({ createdAt: -1 });
  res.json(companies);
};

export const getCompanyById = async (req: Request, res: Response) => {
  const company = await Company.findById(req.params.id);
  if (!company) {
    throw new NotFoundError('Company not found');
  }
  res.json(company);
};

export const updateCompanyStatus = async (req: Request, res: Response) => {
  const { status, comment } = req.body;
  const company = await Company.findById(req.params.id);
  
  if (!company) {
    throw new NotFoundError('Company not found');
  }

  company.status = status;
  if (comment) {
    company.statusComment = comment;
  }
  await company.save();

  // Send notification to company
  await createNotification({
    type: NotificationType.COMPANY_STATUS_UPDATE,
    recipient: company._id,
    data: {
      status,
      comment,
    },
  });

  // Send email notification
  try {
    const emailSubject = `Company Registration ${status === 'approved' ? 'Approved' : 'Rejected'}`;
    const emailBody = `Your company registration has been ${status}. ${comment || ''}`;
    await sendEmail(company.email, emailSubject, emailBody);
  } catch (error) {
    console.error('Failed to send status update email:', error);
  }

  res.json({ message: 'Company status updated successfully' });
};

// Job Management
export const createJob = async (req: Request, res: Response) => {
  const company = await Company.findById(req.user!.id);
  if (!company) {
    throw new UnauthorizedError('Company not found');
  }

  if (company.status !== CompanyStatus.APPROVED) {
    throw new UnauthorizedError('Company must be approved to create jobs');
  }

  const jobData = {
    ...req.body,
    company: company._id,
    status: JobStatus.PENDING,
  };

  if (req.file) {
    const photoUrl = await uploadToS3(req.file);
    jobData.photo = photoUrl;
  }

  const job = new Job(jobData);
  await job.save();

  // Notify admin about new job posting
  await createNotification({
    type: NotificationType.NEW_JOB,
    recipient: 'admin',
    data: {
      jobId: job._id,
      companyName: company.name,
      jobTitle: job.title,
    },
  });

  res.status(201).json(job);
};

export const getJobs = async (req: Request, res: Response) => {
  const {
    status,
    company,
    search,
    location,
    minBudget,
    maxBudget,
    skills,
  } = req.query;

  const query: any = {};

  if (status) {
    query.status = status;
  }

  if (company) {
    query.company = company;
  }

  if (search) {
    query.$or = [
      { title: new RegExp(search as string, 'i') },
      { description: new RegExp(search as string, 'i') },
    ];
  }

  if (location) {
    query['location.type'] = location;
  }

  if (minBudget || maxBudget) {
    query.budget = {};
    if (minBudget) query.budget.$gte = Number(minBudget);
    if (maxBudget) query.budget.$lte = Number(maxBudget);
  }

  if (skills) {
    const skillsArray = (skills as string).split(',');
    query.skills = { $all: skillsArray };
  }

  const jobs = await Job.find(query)
    .populate('company', 'name')
    .sort({ createdAt: -1 });

  res.json(jobs);
};

export const getJobById = async (req: Request, res: Response) => {
  const job = await Job.findById(req.params.id).populate('company', 'name');
  if (!job) {
    throw new NotFoundError('Job not found');
  }
  res.json(job);
};

export const updateJob = async (req: Request, res: Response) => {
  const job = await Job.findOne({
    _id: req.params.id,
    company: req.user!.id,
  });

  if (!job) {
    throw new NotFoundError('Job not found or unauthorized');
  }

  const updates = req.body;
  if (req.file) {
    const photoUrl = await uploadToS3(req.file);
    updates.photo = photoUrl;
  }

  Object.assign(job, updates);
  await job.save();

  res.json(job);
};

export const deleteJob = async (req: Request, res: Response) => {
  const job = await Job.findOne({
    _id: req.params.id,
    company: req.user!.id,
  });

  if (!job) {
    throw new NotFoundError('Job not found or unauthorized');
  }

  await job.remove();
  res.json({ message: 'Job deleted successfully' });
};

export const updateJobStatus = async (req: Request, res: Response) => {
  const { status, comment } = req.body;
  const job = await Job.findById(req.params.id).populate('company');
  
  if (!job) {
    throw new NotFoundError('Job not found');
  }

  job.status = status;
  if (comment) {
    job.statusComment = comment;
  }
  await job.save();

  // Notify company about job status update
  await createNotification({
    type: NotificationType.JOB_STATUS_UPDATE,
    recipient: job.company._id,
    data: {
      jobId: job._id,
      jobTitle: job.title,
      status,
      comment,
    },
  });

  // Send email notification
  try {
    const company = job.company as any;
    const emailSubject = `Job Posting ${status === 'approved' ? 'Approved' : 'Rejected'}`;
    const emailBody = `Your job posting "${job.title}" has been ${status}. ${comment || ''}`;
    await sendEmail(company.email, emailSubject, emailBody);
  } catch (error) {
    console.error('Failed to send job status update email:', error);
  }

  res.json({ message: 'Job status updated successfully' });
};
