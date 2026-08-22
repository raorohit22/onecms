import { Organization, User, Post, Category, Tag, Role } from '@onecms/db';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import argon2 from 'argon2';

export const Factory = {
  createOrganization: async (overrides = {}) => {
    const org = new Organization({
      name: `Org-${uuidv4()}`,
      slug: `org-${uuidv4().substring(0, 8)}`,
      ...overrides
    });
    return await org.save();
  },
  
  createRole: async (organizationId: string, overrides = {}) => {
    const role = new Role({
      name: `Role-${uuidv4()}`,
      organizationId,
      permissions: ['*'], // Default to full perms for testing unless overridden
      ...overrides
    });
    return await role.save();
  },

  createUser: async (organizationId: string, roleId: string, overrides = {}) => {
    const user = new User({
      email: `user-${uuidv4()}@example.com`,
      username: `user_${uuidv4().substring(0, 8)}`,
      firstName: 'Test',
      lastName: 'User',
      passwordHash: await argon2.hash('Password123!'),
      organizationId,
      roleId,
      ...overrides
    });
    return await user.save();
  },

  createCategory: async (organizationId: string, overrides = {}) => {
    const category = new Category({
      name: `Category-${uuidv4()}`,
      slug: `category-${uuidv4().substring(0, 8)}`,
      organizationId,
      ...overrides
    });
    return await category.save();
  },

  createTag: async (organizationId: string, overrides = {}) => {
    const tag = new Tag({
      name: `Tag-${uuidv4()}`,
      slug: `tag-${uuidv4().substring(0, 8)}`,
      organizationId,
      ...overrides
    });
    return await tag.save();
  },

  createPost: async (organizationId: string, authorId: string, overrides = {}) => {
    const post = new Post({
      title: `Post-${uuidv4()}`,
      slug: `post-${uuidv4().substring(0, 8)}`,
      excerpt: 'Test excerpt',
      content: '<p>Test content</p>',
      status: 'DRAFT',
      organizationId,
      authorId,
      ...overrides
    });
    return await post.save();
  },
  
  // Creates an isolated tenant context with a user and all basic entities for testing
  setupIsolatedTenant: async () => {
    const org = await Factory.createOrganization();
    const role = await Factory.createRole(org.id);
    const user = await Factory.createUser(org.id, role.id);
    
    return {
      organization: org,
      role,
      user
    };
  }
};
