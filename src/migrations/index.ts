import * as migration_20260628_152258_initial from './20260628_152258_initial';

export const migrations = [
  {
    up: migration_20260628_152258_initial.up,
    down: migration_20260628_152258_initial.down,
    name: '20260628_152258_initial'
  },
];
