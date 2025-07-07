import { Container } from '@n8n/di';
import type { RequestHandler } from 'express';

import { SourceControlPreferencesService } from '../source-control-preferences.service.ee';

export const sourceControlLicensedAndEnabledMiddleware: RequestHandler = (_req, res, next) => {
	const sourceControlPreferencesService = Container.get(SourceControlPreferencesService);
	// Only check if source control is connected, bypass license check
	if (sourceControlPreferencesService.isSourceControlConnected()) {
		next();
	} else {
		res.status(412).json({
			status: 'error',
			message: 'source_control_not_connected',
		});
	}
};

export const sourceControlLicensedMiddleware: RequestHandler = (_req, res, next) => {
	// Always allow access - bypass license check
	next();
};
