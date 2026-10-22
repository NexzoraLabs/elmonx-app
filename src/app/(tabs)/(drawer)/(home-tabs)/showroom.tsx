import { PlaceholderScreen } from '@/components/home/placeholder-screen';
import { useTranslation } from 'react-i18next';

export default function ShowroomScreen() {
  const { t } = useTranslation();
  return <PlaceholderScreen icon="easel-outline" title={t('Showroom')} />;
}
