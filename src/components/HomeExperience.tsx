'use client';

import { useState } from 'react';
import type { Candidate, DiscoverResponse, IcebreakerResponse } from '@/lib/types';
import { postJson } from '@/lib/api-client';
import { IntroSection } from './IntroSection';
import { LoadingSearch } from './LoadingSearch';
import { CandidateList } from './CandidateList';
import { NotFoundState } from './NotFoundState';
import { IcebreakerGenerating } from './IcebreakerGenerating';
import { IcebreakerResult } from './IcebreakerResult';
import { AuthBadge } from './AuthBadge';
import { VideoIntro } from './VideoIntro';

type Stage = 'intro' | 'loading' | 'results' | 'not-found' | 'generating' | 'generated';

interface DiscoverState {
  situation: string;
  query: string;
  candidates: Candidate[];
  emptyReason?: string;
}

export function HomeExperience() {
  const [stage, setStage] = useState<Stage>('intro');
  const [discover, setDiscover] = useState<DiscoverState>({ situation: '', query: '', candidates: [] });
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleDiscover(situation: string) {
    setError(null);
    setStage('loading');
    const result = await postJson<DiscoverResponse>('/api/discover', { situation });

    if (!result.ok) {
      setError(result.error);
      setDiscover((d) => ({ ...d, situation }));
      setStage('intro');
      return;
    }

    setDiscover({
      situation,
      query: result.data.query,
      candidates: result.data.candidates,
      emptyReason: result.data.emptyReason,
    });
    setStage(result.data.notFound ? 'not-found' : 'results');
  }

  async function handlePick(candidate: Candidate) {
    setError(null);
    setSelected(candidate);
    setStage('generating');
    const result = await postJson<IcebreakerResponse>('/api/icebreaker', {
      candidate,
      situation: discover.situation,
    });

    if (!result.ok) {
      setError(result.error);
      setStage('results');
      return;
    }

    setMessage(result.data.message);
    setStage('generated');
  }

  function backToIntro() {
    setError(null);
    setStage('intro');
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 px-6 py-16">
      <AuthBadge />
      <div className="flex flex-1 flex-col justify-center gap-10">
        {stage === 'intro' && (
          <>
            <VideoIntro />
            <IntroSection initialSituation={discover.situation} error={error} onSubmit={handleDiscover} />
          </>
        )}
        {stage === 'loading' && <LoadingSearch />}
        {stage === 'results' && (
          <>
            {error && (
              <p role="alert" className="text-center text-sm text-brick">
                {error}
              </p>
            )}
            <CandidateList
              query={discover.query}
              candidates={discover.candidates}
              onPick={handlePick}
              onRetry={backToIntro}
            />
          </>
        )}
        {stage === 'not-found' && (
          <NotFoundState query={discover.query} emptyReason={discover.emptyReason} onRetry={backToIntro} />
        )}
        {stage === 'generating' && selected && <IcebreakerGenerating authorName={selected.authorName} />}
        {stage === 'generated' && selected && (
          <IcebreakerResult
            candidate={selected}
            message={message}
            onPickAnother={() => setStage('results')}
            onStartOver={() => {
              setDiscover({ situation: '', query: '', candidates: [] });
              setStage('intro');
            }}
          />
        )}
      </div>
    </main>
  );
}
