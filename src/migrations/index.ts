import * as migration_20260628_152258_initial from './20260628_152258_initial';
import * as migration_20260628_153136_media from './20260628_153136_media';

export const migrations = [
  {
    up: migration_20260628_152258_initial.up,
    down: migration_20260628_152258_initial.down,
    name: '20260628_152258_initial',
  },
  {
    up: migration_20260628_153136_media.up,
    down: migration_20260628_153136_media.down,
    name: '20260628_153136_media'
  },
];
