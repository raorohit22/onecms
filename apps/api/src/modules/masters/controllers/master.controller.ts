import { Request, Response } from 'express';
import { MasterService } from '../services/master.service';

const masterService = new MasterService();

export const masterController = {
  // --- Master Types ---
  async getTypes(req: Request, res: Response) {
    try {
      const types = await masterService.getMasterTypes(req.tenant!.organizationId);
      res.json(types);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getTypeBySlug(req: Request, res: Response) {
    try {
      const type = await masterService.getMasterTypeBySlug(req.tenant!.organizationId, req.params.slug as string);
      if (!type) {
        return res.status(404).json({ error: 'Master Type not found' });
      }
      res.json(type);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async createType(req: Request, res: Response) {
    try {
      const payload = { ...req.body, createdBy: req.user?.userId };
      const type = await masterService.createMasterType(req.tenant!.organizationId, payload);
      res.status(201).json(type);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async updateType(req: Request, res: Response) {
    try {
      const type = await masterService.updateMasterType(req.tenant!.organizationId, req.params.id as string, req.body);
      res.json(type);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async deleteType(req: Request, res: Response) {
    try {
      await masterService.deleteMasterType(req.tenant!.organizationId, req.params.id as string);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  // --- Master Data ---
  async getValues(req: Request, res: Response) {
    try {
      let typeId = req.params.typeId as string;
      if (!typeId.match(/^[0-9a-fA-F]{24}$/)) {
        const type = await masterService.getMasterTypeBySlug(req.tenant!.organizationId, typeId);
        if (!type) return res.status(404).json({ error: 'Master Type not found' });
        typeId = type.id;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const sortField = (req.query.sort as string) || 'sortOrder';
      const sortDir = (req.query.dir as string) === 'desc' ? -1 : 1; // Default asc for master data
      const skip = (page - 1) * limit;

      const { data, total } = await masterService.getMasterValues(req.tenant!.organizationId, typeId, {
        skip,
        limit,
        sort: { [sortField]: sortDir, label: 1 } // Secondary sort by label
      });

      res.status(200).json({
        data,
        meta: {
          total,
          page,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async createValue(req: Request, res: Response) {
    try {
      let typeId = req.params.typeId as string;
      if (!typeId.match(/^[0-9a-fA-F]{24}$/)) {
        const type = await masterService.getMasterTypeBySlug(req.tenant!.organizationId, typeId);
        if (!type) return res.status(404).json({ error: 'Master Type not found' });
        typeId = type.id;
      }

      const payload = { ...req.body, createdBy: req.user?.userId };
      const value = await masterService.createMasterValue(req.tenant!.organizationId, typeId, payload);
      res.status(201).json(value);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async updateValue(req: Request, res: Response) {
    try {
      let typeId = req.params.typeId as string;
      if (!typeId.match(/^[0-9a-fA-F]{24}$/)) {
        const type = await masterService.getMasterTypeBySlug(req.tenant!.organizationId, typeId);
        if (!type) return res.status(404).json({ error: 'Master Type not found' });
        typeId = type.id;
      }

      const value = await masterService.updateMasterValue(req.tenant!.organizationId, typeId, req.params.id as string, req.body);
      res.json(value);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async deleteValue(req: Request, res: Response) {
    try {
      let typeId = req.params.typeId as string;
      if (!typeId.match(/^[0-9a-fA-F]{24}$/)) {
        const type = await masterService.getMasterTypeBySlug(req.tenant!.organizationId, typeId);
        if (!type) return res.status(404).json({ error: 'Master Type not found' });
        typeId = type.id;
      }

      await masterService.deleteMasterValue(req.tenant!.organizationId, typeId, req.params.id as string);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async bulkDeleteValues(req: Request, res: Response) {
    try {
      let typeId = req.params.typeId as string;
      if (!typeId.match(/^[0-9a-fA-F]{24}$/)) {
        const type = await masterService.getMasterTypeBySlug(req.tenant!.organizationId, typeId);
        if (!type) return res.status(404).json({ error: 'Master Type not found' });
        typeId = type.id;
      }

      const count = await masterService.deleteManyMasterValues(req.tenant!.organizationId, typeId, req.body);
      res.json({ success: true, count });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async exportValues(req: Request, res: Response) {
    try {
      let typeId = req.params.typeId as string;
      if (!typeId.match(/^[0-9a-fA-F]{24}$/)) {
        const type = await masterService.getMasterTypeBySlug(req.tenant!.organizationId, typeId);
        if (!type) return res.status(404).json({ error: 'Master Type not found' });
        typeId = type.id;
      }

      const data = await masterService.exportMasterValues(req.tenant!.organizationId, typeId);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async importValues(req: Request, res: Response) {
    try {
      let typeId = req.params.typeId as string;
      if (!typeId.match(/^[0-9a-fA-F]{24}$/)) {
        const type = await masterService.getMasterTypeBySlug(req.tenant!.organizationId, typeId);
        if (!type) return res.status(404).json({ error: 'Master Type not found' });
        typeId = type.id;
      }

      if (!req.body || !Array.isArray(req.body)) {
        return res.status(400).json({ error: 'Expected an array of JSON objects' });
      }

      const result = await masterService.importMasterValues(req.tenant!.organizationId, typeId, req.body, req.user?.userId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
};
