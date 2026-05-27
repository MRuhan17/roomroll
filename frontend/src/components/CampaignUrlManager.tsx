import React, { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { encodeCampaignId } from '@/lib/campaignId';

export function CampaignUrlManager({ children }: { children: React.ReactNode }) {
  const { campaignId, id } = useParams<{ campaignId?: string; id?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const rawId = campaignId || id;
    if (rawId && /^\d+$/.test(rawId)) {
      const numericId = parseInt(rawId, 10);
      const encoded = encodeCampaignId(numericId);
      const newPath = location.pathname.replace(rawId, encoded);
      navigate(newPath, { replace: true });
    }
  }, [campaignId, id, location.pathname, navigate]);

  return <>{children}</>;
}
