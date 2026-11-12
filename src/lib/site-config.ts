import source from '../../site.config.yml?raw';
import { parseSiteConfig } from './site-config-schema';

export const siteConfig = parseSiteConfig(source);
