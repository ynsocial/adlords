import mongoose from 'mongoose';
import { JobService } from '../../services/JobService';
import Job from '../../models/Job';
import { AppError } from '../../utils/errors';

describe('JobService', () => {
  describe('createJob', () => {
    it('should create a new job successfully', async () => {
      const jobData = {
        title: 'Test Job',
        description: 'Test job description that meets the minimum length requirement for testing purposes',
        shortDescription: 'A brief description of the test job for listing purposes',
        requirements: ['Requirement 1', 'Requirement 2'],
        responsibilities: ['Responsibility 1', 'Responsibility 2'],
        category: ['Healthcare'],
        type: 'Full-time',
        location: {
          type: 'Remote',
        },
        budget: {
          range: {
            min: 1000,
            max: 2000,
          },
          type: 'Fixed',
          currency: 'USD',
        },
        duration: {
          startDate: new Date(),
        },
        skills: ['Skill 1', 'Skill 2'],
        companyId: new mongoose.Types.ObjectId().toString(),
      };

      const job = await JobService.createJob(jobData);

      expect(job).toBeDefined();
      expect(job.title).toBe(jobData.title);
      expect(job.status).toBe('Draft');
      expect(job.currentApplications).toBe(0);
    });

    it('should throw error if budget range is invalid', async () => {
      const jobData = {
        // ... other required fields
        budget: {
          range: {
            min: 2000,
            max: 1000, // Invalid: min > max
          },
          type: 'Fixed',
          currency: 'USD',
        },
      };

      await expect(JobService.createJob(jobData)).rejects.toThrow(AppError);
    });
  });

  describe('getJobs', () => {
    beforeEach(async () => {
      // Create test jobs
      await Job.create([
        {
          title: 'Job 1',
          description: 'Description 1',
          shortDescription: 'Short description 1',
          requirements: ['Req 1'],
          responsibilities: ['Resp 1'],
          category: ['Cat 1'],
          type: 'Full-time',
          location: { type: 'Remote' },
          budget: {
            range: { min: 1000, max: 2000 },
            type: 'Fixed',
            currency: 'USD',
          },
          duration: { startDate: new Date() },
          skills: ['Skill 1'],
          status: 'Active',
          companyId: new mongoose.Types.ObjectId(),
        },
        {
          title: 'Job 2',
          description: 'Description 2',
          shortDescription: 'Short description 2',
          requirements: ['Req 2'],
          responsibilities: ['Resp 2'],
          category: ['Cat 2'],
          type: 'Part-time',
          location: { type: 'On-site' },
          budget: {
            range: { min: 2000, max: 3000 },
            type: 'Hourly',
            currency: 'USD',
          },
          duration: { startDate: new Date() },
          skills: ['Skill 2'],
          status: 'Draft',
          companyId: new mongoose.Types.ObjectId(),
        },
      ]);
    });

    it('should return only active jobs for public access', async () => {
      const result = await JobService.getJobs({
        filter: {},
        page: 1,
        limit: 10,
      });

      expect(result.jobs).toHaveLength(1);
      expect(result.jobs[0].status).toBe('Active');
    });

    it('should filter jobs by category', async () => {
      const result = await JobService.getJobs({
        filter: { category: ['Cat 1'] },
        page: 1,
        limit: 10,
      });

      expect(result.jobs).toHaveLength(1);
      expect(result.jobs[0].category).toContain('Cat 1');
    });
  });

  describe('updateJob', () => {
    let jobId: string;
    let companyId: string;

    beforeEach(async () => {
      companyId = new mongoose.Types.ObjectId().toString();
      const job = await Job.create({
        title: 'Original Title',
        description: 'Original description that meets the minimum length requirement',
        shortDescription: 'Original short description for listing',
        requirements: ['Original Req'],
        responsibilities: ['Original Resp'],
        category: ['Original Cat'],
        type: 'Full-time',
        location: { type: 'Remote' },
        budget: {
          range: { min: 1000, max: 2000 },
          type: 'Fixed',
          currency: 'USD',
        },
        duration: { startDate: new Date() },
        skills: ['Original Skill'],
        companyId,
      });
      jobId = job._id.toString();
    });

    it('should update job successfully', async () => {
      const updateData = {
        title: 'Updated Title',
        description: 'Updated description that still meets the minimum length requirement',
      };

      const updatedJob = await JobService.updateJob(jobId, updateData, companyId);

      expect(updatedJob.title).toBe(updateData.title);
      expect(updatedJob.description).toBe(updateData.description);
    });

    it('should throw error if job not found', async () => {
      const fakeJobId = new mongoose.Types.ObjectId().toString();
      
      await expect(
        JobService.updateJob(fakeJobId, { title: 'New Title' }, companyId)
      ).rejects.toThrow('Job not found or unauthorized');
    });
  });
});
