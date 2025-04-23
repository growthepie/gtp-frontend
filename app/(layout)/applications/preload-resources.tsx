import { ApplicationsURLs } from '@/lib/urls';
import ReactDOM from 'react-dom';


// prefetch data for all timeframes
export function PreloadResources() {
  ReactDOM.preload(ApplicationsURLs.overview.replace('_test', '_1d'), { as: 'fetch' });
  ReactDOM.preload(ApplicationsURLs.overview.replace('_test', '_7d'), { as: 'fetch' });
  ReactDOM.preload(ApplicationsURLs.overview.replace('_test', '_30d'), { as: 'fetch' });
  ReactDOM.preload(ApplicationsURLs.overview.replace('_test', '_90d'), { as: 'fetch' });
  ReactDOM.preload(ApplicationsURLs.overview.replace('_test', '_365d'), { as: 'fetch' });
  ReactDOM.preload(ApplicationsURLs.overview.replace('_test', '_max'), { as: 'fetch' });

  return null;
}
