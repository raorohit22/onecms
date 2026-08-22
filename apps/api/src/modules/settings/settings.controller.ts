import { Request, Response } from 'express';
import { settingsService } from './settings.service';

class SettingsController {
  async getRoles(req: Request, res: Response) {
    try {
      const roles = await settingsService.getRoles(req.tenant!.organizationId);
      res.json(roles);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async createRole(req: Request, res: Response) {
    try {
      const role = await settingsService.createRole(req.tenant!.organizationId, req.body);
      res.status(201).json(role);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async updateRole(req: Request, res: Response) {
    try {
      const role = await settingsService.updateRole(req.params.id as string, req.tenant!.organizationId, req.body);
      if (!role) return res.status(404).json({ error: 'Role not found' });
      res.json(role);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async deleteRole(req: Request, res: Response) {
    try {
      await settingsService.deleteRole(req.params.id as string, req.tenant!.organizationId);
      res.status(204).send();
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async getPermissions(req: Request, res: Response) {
    try {
      const permissions = await settingsService.getPermissions();
      res.json(permissions);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}

export const settingsController = new SettingsController();
