import { FilterQuery } from 'mongoose';
import Ambassador, { IAmbassador } from '../models/Ambassador';
import { AppError } from '../utils/errors';
import { redisClient } from '../config/redis';

export class AmbassadorService {
  private static CACHE_TTL = 3600; // 1 hour in seconds

  // Create a new ambassador
  static async createAmbassador(data: Partial<IAmbassador>): Promise<IAmbassador> {
    try {
      const ambassador = new Ambassador(data);
      await ambassador.save();
      
      // Clear related cache
      await this.clearCache(`ambassadors:*`);
      
      return ambassador;
    } catch (error: any) {
      if (error.code === 11000) {
        throw new AppError('Ambassador already exists with this email', 400);
      }
      throw error;
    }
  }

  // Get ambassador by ID
  static async getAmbassadorById(id: string): Promise<IAmbassador | null> {
    const cacheKey = `ambassador:${id}`;
    
    // Try to get from cache
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const ambassador = await Ambassador.findById(id);
    
    if (ambassador) {
      // Cache the result
      await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(ambassador));
    }
    
    return ambassador;
  }

  // Update ambassador
  static async updateAmbassador(
    id: string,
    data: Partial<IAmbassador>
  ): Promise<IAmbassador | null> {
    const ambassador = await Ambassador.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!ambassador) {
      throw new AppError('Ambassador not found', 404);
    }

    // Clear related cache
    await this.clearCache(`ambassador:${id}`);
    await this.clearCache(`ambassadors:*`);

    return ambassador;
  }

  // Delete ambassador
  static async deleteAmbassador(id: string): Promise<void> {
    const result = await Ambassador.findByIdAndDelete(id);
    
    if (!result) {
      throw new AppError('Ambassador not found', 404);
    }

    // Clear related cache
    await this.clearCache(`ambassador:${id}`);
    await this.clearCache(`ambassadors:*`);
  }

  // Get all ambassadors with filtering, sorting, and pagination
  static async getAmbassadors(params: {
    filter?: FilterQuery<IAmbassador>;
    sort?: string;
    page?: number;
    limit?: number;
    status?: string;
    verificationStatus?: string;
    skills?: string[];
    availability?: string;
  }): Promise<{
    ambassadors: IAmbassador[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      filter = {},
      sort = '-createdAt',
      page = 1,
      limit = 10,
      status,
      verificationStatus,
      skills,
      availability,
    } = params;

    // Build query
    let query: FilterQuery<IAmbassador> = { ...filter };
    
    if (status) {
      query.status = status;
    }
    
    if (verificationStatus) {
      query.verificationStatus = verificationStatus;
    }
    
    if (skills && skills.length > 0) {
      query.skills = { $all: skills };
    }
    
    if (availability) {
      query['availability.status'] = availability;
    }

    const cacheKey = `ambassadors:${JSON.stringify({
      query,
      sort,
      page,
      limit,
    })}`;

    // Try to get from cache
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Execute query
    const skip = (page - 1) * limit;
    const [ambassadors, total] = await Promise.all([
      Ambassador.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      Ambassador.countDocuments(query),
    ]);

    const result = {
      ambassadors,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };

    // Cache the result
    await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(result));

    return result;
  }

  // Update ambassador verification status
  static async updateVerificationStatus(
    id: string,
    status: 'Unverified' | 'Pending' | 'Verified' | 'Rejected'
  ): Promise<IAmbassador> {
    const ambassador = await Ambassador.findByIdAndUpdate(
      id,
      { 
        $set: { 
          verificationStatus: status,
          status: status === 'Verified' ? 'Active' : 'Pending'
        } 
      },
      { new: true }
    );

    if (!ambassador) {
      throw new AppError('Ambassador not found', 404);
    }

    // Clear related cache
    await this.clearCache(`ambassador:${id}`);
    await this.clearCache(`ambassadors:*`);

    return ambassador;
  }

  // Update ambassador rating
  static async updateRating(
    id: string,
    rating: number
  ): Promise<IAmbassador> {
    const ambassador = await Ambassador.findById(id);
    
    if (!ambassador) {
      throw new AppError('Ambassador not found', 404);
    }

    ambassador.rating.average = 
      (ambassador.rating.average * ambassador.rating.count + rating) / 
      (ambassador.rating.count + 1);
    ambassador.rating.count += 1;

    await ambassador.save();

    // Clear related cache
    await this.clearCache(`ambassador:${id}`);
    await this.clearCache(`ambassadors:*`);

    return ambassador;
  }

  // Increment completed jobs count
  static async incrementCompletedJobs(id: string): Promise<IAmbassador> {
    const ambassador = await Ambassador.findByIdAndUpdate(
      id,
      { $inc: { completedJobs: 1 } },
      { new: true }
    );

    if (!ambassador) {
      throw new AppError('Ambassador not found', 404);
    }

    // Clear related cache
    await this.clearCache(`ambassador:${id}`);
    await this.clearCache(`ambassadors:*`);

    return ambassador;
  }

  // Helper method to clear cache
  private static async clearCache(pattern: string): Promise<void> {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  }
}

export default AmbassadorService;
