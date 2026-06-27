import { localeString } from './objects/localeString';
import { localeText } from './objects/localeText';
import { localePortableText } from './objects/localePortableText';
import { siteSettings } from './documents/siteSettings';
import { navigation } from './documents/navigation';
import { homePage } from './documents/homePage';
import { service } from './documents/service';
import { product } from './documents/product';
import { project } from './documents/project';
import { reference } from './documents/reference';
import { faq } from './documents/faq';
import { post } from './documents/post';
import { jobPosting } from './documents/jobPosting';
import { page } from './documents/page';

export const schemaTypes = [
  localeString, localeText, localePortableText,
  siteSettings, navigation, homePage, service, product, project,
  reference, faq, post, jobPosting, page,
];
