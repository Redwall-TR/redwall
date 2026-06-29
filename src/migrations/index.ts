import * as migration_20260628_152258_initial from './20260628_152258_initial';
import * as migration_20260628_153136_media from './20260628_153136_media';
import * as migration_20260628_153642_collections1 from './20260628_153642_collections1';
import * as migration_20260628_154834_service_iskolu_unique from './20260628_154834_service_iskolu_unique';
import * as migration_20260628_155709_collections2 from './20260628_155709_collections2';
import * as migration_20260629_095057_richpage_kunye from './20260629_095057_richpage_kunye';
import * as migration_20260629_101844_product_yayinda from './20260629_101844_product_yayinda';
import * as migration_20260629_150619_kurumsal_koleksiyonlar from './20260629_150619_kurumsal_koleksiyonlar';
import * as migration_20260629_161326_form_gonderimi from './20260629_161326_form_gonderimi';
import * as migration_20260629_175116_form_gonderimi_kvkk from './20260629_175116_form_gonderimi_kvkk';
import * as migration_20260629_183442_form_gonderimi_kvkk_alanlar from './20260629_183442_form_gonderimi_kvkk_alanlar';

export const migrations = [
  {
    up: migration_20260628_152258_initial.up,
    down: migration_20260628_152258_initial.down,
    name: '20260628_152258_initial',
  },
  {
    up: migration_20260628_153136_media.up,
    down: migration_20260628_153136_media.down,
    name: '20260628_153136_media',
  },
  {
    up: migration_20260628_153642_collections1.up,
    down: migration_20260628_153642_collections1.down,
    name: '20260628_153642_collections1',
  },
  {
    up: migration_20260628_154834_service_iskolu_unique.up,
    down: migration_20260628_154834_service_iskolu_unique.down,
    name: '20260628_154834_service_iskolu_unique',
  },
  {
    up: migration_20260628_155709_collections2.up,
    down: migration_20260628_155709_collections2.down,
    name: '20260628_155709_collections2',
  },
  {
    up: migration_20260629_095057_richpage_kunye.up,
    down: migration_20260629_095057_richpage_kunye.down,
    name: '20260629_095057_richpage_kunye',
  },
  {
    up: migration_20260629_101844_product_yayinda.up,
    down: migration_20260629_101844_product_yayinda.down,
    name: '20260629_101844_product_yayinda',
  },
  {
    up: migration_20260629_150619_kurumsal_koleksiyonlar.up,
    down: migration_20260629_150619_kurumsal_koleksiyonlar.down,
    name: '20260629_150619_kurumsal_koleksiyonlar',
  },
  {
    up: migration_20260629_161326_form_gonderimi.up,
    down: migration_20260629_161326_form_gonderimi.down,
    name: '20260629_161326_form_gonderimi',
  },
  {
    up: migration_20260629_175116_form_gonderimi_kvkk.up,
    down: migration_20260629_175116_form_gonderimi_kvkk.down,
    name: '20260629_175116_form_gonderimi_kvkk',
  },
  {
    up: migration_20260629_183442_form_gonderimi_kvkk_alanlar.up,
    down: migration_20260629_183442_form_gonderimi_kvkk_alanlar.down,
    name: '20260629_183442_form_gonderimi_kvkk_alanlar'
  },
];
