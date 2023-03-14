import enLangs from './en.lang';
import viLangs from './vi.lang';

const map = new Map<string, Map<string, string>>();

map.set('vi', viLangs);
map.set('en', enLangs);

export default map;
