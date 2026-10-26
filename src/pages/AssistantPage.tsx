import { Layout } from '../components/Layout.tsx';
import { VTitle } from '../components/VisitorShell.tsx';
import { Assistant } from '../components/Assistant.tsx';
import { usePrefs } from '../lib/prefs.tsx';

export default function AssistantPage() {
  const { t } = usePrefs();
  return (
    <Layout visitor>
      <VTitle sub={t('assistant.label')}>{t('v.more.assistant')}</VTitle>
      <Assistant inline />
    </Layout>
  );
}
