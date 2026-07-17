import { useAnalyticsPageview } from '@/hooks/useAnalyticsPageview';

export default function AnalyticsTracker() {
    useAnalyticsPageview();
    return null;
}