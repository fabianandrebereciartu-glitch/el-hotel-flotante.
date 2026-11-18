import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import {
  DOSSIER_REFERENCE_CODE,
  RESIDENCE_OPTIONS,
  getDefaultResidenceForLevel,
  type ResidenceOption,
} from '../architecture/residences';

interface InquiryModalProps {
  isOpen: boolean;
  defaultLevelId?: string;
  onClose: () => void;
}

export function InquiryModal({ isOpen, defaultLevelId, onClose }: InquiryModalProps) {
  const [selectedResidenceId, setSelectedResidenceId] = useState<string>(
    () => getDefaultResidenceForLevel(defaultLevelId).id,
  );
  const [privateMayfairTransfer, setPrivateMayfairTransfer] = useState(true);
  const [champagneReception, setChampagneReception] = useState(false);
  const [preferredDate, setPreferredDate] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedDossier, setSubmittedDossier] = useState<{
    referenceCode: string;
    residence: ResidenceOption;
    principalName: string;
    email: string;
    preferredDate: string;
    privateMayfairTransfer: boolean;
    champagneReception: boolean;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedResidenceId(getDefaultResidenceForLevel(defaultLevelId).id);
    setSubmittedDossier(null);
    setErrorMessage(null);
  }, [isOpen, defaultLevelId]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const selectedResidence =
    RESIDENCE_OPTIONS.find((r) => r.id === selectedResidenceId) ?? RESIDENCE_OPTIONS[2];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (trimmedName.length < 2) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid private email address.');
      return;
    }

    setErrorMessage(null);
    setSubmittedDossier({
      referenceCode: DOSSIER_REFERENCE_CODE,
      residence: selectedResidence,
      principalName: trimmedName,
      email: trimmedEmail,
      preferredDate: preferredDate || 'By Private Arrangement',
      privateMayfairTransfer,
      champagneReception,
    });
  };

  const handleClose = () => {
    setSubmittedDossier(null);
    setErrorMessage(null);
    onClose();
  };

  return (
    <div
      id="inquiry-modal"
      className="fixed inset-0 z-50 flex justify-end bg-[#09090B]/80"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inquiry-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <aside className="relative flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-[#C29B38]/20 bg-[#0C0C0F] px-6 py-7 text-[#F4EFE6] sm:px-9 sm:py-9">
        <div className="flex items-start justify-between gap-4 border-b border-[rgba(244,239,230,0.12)] pb-5">
          <div>
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-[#C29B38]">
              MAYFAIR PRIVATE OFFICE · LONDON SW1A
            </p>
            <h2
              id="inquiry-modal-title"
              className="mt-2 font-display text-lg tracking-[0.14em] uppercase text-[#F4EFE6] sm:text-xl"
            >
              Private Residence Dossier
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close inquiry drawer"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[2px] border border-[rgba(244,239,230,0.14)] text-[#F4EFE6]/70 transition-colors duration-150 hover:border-[#C29B38] hover:text-[#F4EFE6] focus-visible:outline-2 focus-visible:outline-[#C29B38]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {submittedDossier ? (
          <div className="flex flex-1 flex-col justify-between pt-7">
            <div>
              <div className="border border-[#C29B38]/30 bg-[#09090B] p-5">
                <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-[#C29B38]">
                  ESTATE DOSSIER REGISTERED
                </p>
                <p
                  data-testid="dossier-reference-code"
                  className="mt-1.5 font-mono text-base tracking-[0.14em] text-[#F4EFE6]"
                >
                  {submittedDossier.referenceCode}
                </p>

                <dl className="mt-5 space-y-3 border-t border-[rgba(244,239,230,0.12)] pt-4 text-xs">
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="font-mono text-[10px] tracking-[0.14em] uppercase text-[rgba(244,239,230,0.6)]">
                      Residence
                    </dt>
                    <dd className="text-right font-light text-[#F4EFE6]">
                      {submittedDossier.residence.levelLabel} · {submittedDossier.residence.title} (
                      {submittedDossier.residence.areaSqm} m²)
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="font-mono text-[10px] tracking-[0.14em] uppercase text-[rgba(244,239,230,0.6)]">
                      Guide Total
                    </dt>
                    <dd
                      data-testid="dossier-total-price"
                      className="font-mono text-sm tracking-[0.08em] text-[#C29B38]"
                    >
                      {submittedDossier.residence.priceFormatted}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="font-mono text-[10px] tracking-[0.14em] uppercase text-[rgba(244,239,230,0.6)]">
                      Principal
                    </dt>
                    <dd className="text-right font-light text-[#F4EFE6]">
                      {submittedDossier.principalName}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="font-mono text-[10px] tracking-[0.14em] uppercase text-[rgba(244,239,230,0.6)]">
                      Private Email
                    </dt>
                    <dd className="text-right font-light text-[#F4EFE6]">
                      {submittedDossier.email}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="font-mono text-[10px] tracking-[0.14em] uppercase text-[rgba(244,239,230,0.6)]">
                      Viewing Date
                    </dt>
                    <dd className="text-right font-mono text-[11px] text-[#F4EFE6]">
                      {submittedDossier.preferredDate}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="font-mono text-[10px] tracking-[0.14em] uppercase text-[rgba(244,239,230,0.6)]">
                      Concierge
                    </dt>
                    <dd className="text-right font-light text-[#F4EFE6]/85">
                      {[
                        submittedDossier.privateMayfairTransfer && 'Private Mayfair transfer',
                        submittedDossier.champagneReception && 'Champagne reception',
                      ]
                        .filter(Boolean)
                        .join(' · ') || 'Standard discreet briefing'}
                    </dd>
                  </div>
                </dl>
              </div>

              <p className="mt-5 border-l border-[#C29B38]/40 pl-3.5 font-mono text-[11px] leading-[1.6] text-[rgba(244,239,230,0.72)]">
                Interactive prototype preview — no private viewing was transmitted.
              </p>
            </div>

            <div className="mt-8 flex justify-end border-t border-[rgba(244,239,230,0.12)] pt-5">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-[2px] bg-[#F4EFE6] px-6 py-2.5 text-xs font-medium tracking-[0.12em] uppercase text-[#09090B] transition-colors duration-150 hover:bg-[#C29B38] focus-visible:outline-2 focus-visible:outline-[#C29B38]"
              >
                Return to Towers
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-1 flex-col gap-5" noValidate>
            <fieldset>
              <legend className="font-mono text-[10px] tracking-[0.16em] uppercase text-[rgba(244,239,230,0.65)]">
                Residence Collection
              </legend>
              <div className="mt-2.5 space-y-2">
                {RESIDENCE_OPTIONS.map((option) => {
                  const isSelected = option.id === selectedResidence.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSelectedResidenceId(option.id)}
                      aria-pressed={isSelected}
                      className={`flex w-full items-center justify-between gap-3 rounded-[2px] border px-3.5 py-3 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[#C29B38] ${
                        isSelected
                          ? 'border-[#C29B38] bg-[#161513] text-[#F4EFE6]'
                          : 'border-[rgba(244,239,230,0.12)] bg-[#09090B] text-[rgba(244,239,230,0.78)] hover:border-[rgba(244,239,230,0.32)]'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-[#C29B38]">
                          {option.levelLabel} · {option.areaSqm} m²
                        </p>
                        <p className="mt-0.5 truncate font-serif text-sm tracking-[0.02em] text-[#F4EFE6]">
                          {option.title}
                        </p>
                      </div>
                      <span className="shrink-0 font-mono text-xs tracking-[0.06em] tabular-nums text-[#F4EFE6]">
                        {option.priceFormatted}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="border-t border-[rgba(244,239,230,0.12)] pt-4">
              <legend className="font-mono text-[10px] tracking-[0.16em] uppercase text-[rgba(244,239,230,0.65)]">
                Concierge Arrangements
              </legend>
              <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <label className="flex cursor-pointer items-center gap-2.5 rounded-[2px] border border-[rgba(244,239,230,0.12)] bg-[#09090B] px-3 py-2.5 text-xs font-light text-[#F4EFE6]/90 hover:border-[#C29B38]/50">
                  <input
                    type="checkbox"
                    checked={privateMayfairTransfer}
                    onChange={(e) => setPrivateMayfairTransfer(e.target.checked)}
                    className="h-3.5 w-3.5 accent-[#C29B38]"
                  />
                  <span>Private Mayfair transfer</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2.5 rounded-[2px] border border-[rgba(244,239,230,0.12)] bg-[#09090B] px-3 py-2.5 text-xs font-light text-[#F4EFE6]/90 hover:border-[#C29B38]/50">
                  <input
                    type="checkbox"
                    checked={champagneReception}
                    onChange={(e) => setChampagneReception(e.target.checked)}
                    className="h-3.5 w-3.5 accent-[#C29B38]"
                  />
                  <span>Champagne reception</span>
                </label>
              </div>
            </fieldset>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="inquiry-name"
                  className="block font-mono text-[10px] tracking-[0.16em] uppercase text-[rgba(244,239,230,0.65)]"
                >
                  Full Name
                </label>
                <input
                  id="inquiry-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Principal Name"
                  required
                  className="mt-1.5 w-full rounded-[2px] border border-[rgba(244,239,230,0.16)] bg-[#09090B] px-3.5 py-2.5 text-sm font-light text-[#F4EFE6] placeholder:text-[rgba(244,239,230,0.35)] focus:border-[#C29B38] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="inquiry-date"
                  className="block font-mono text-[10px] tracking-[0.16em] uppercase text-[rgba(244,239,230,0.65)]"
                >
                  Preferred Date
                </label>
                <input
                  id="inquiry-date"
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="mt-1.5 w-full rounded-[2px] border border-[rgba(244,239,230,0.16)] bg-[#09090B] px-3.5 py-2.5 text-sm font-light text-[#F4EFE6] focus:border-[#C29B38] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="inquiry-email"
                className="block font-mono text-[10px] tracking-[0.16em] uppercase text-[rgba(244,239,230,0.65)]"
              >
                Private Email
              </label>
              <input
                id="inquiry-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="office@estate.co.uk"
                required
                className="mt-1.5 w-full rounded-[2px] border border-[rgba(244,239,230,0.16)] bg-[#09090B] px-3.5 py-2.5 text-sm font-light text-[#F4EFE6] placeholder:text-[rgba(244,239,230,0.35)] focus:border-[#C29B38] focus:outline-none"
              />
            </div>

            {errorMessage && (
              <p role="alert" className="font-mono text-[11px] text-[#E57368]">
                {errorMessage}
              </p>
            )}

            <div className="mt-auto flex items-center justify-between gap-3 border-t border-[rgba(244,239,230,0.12)] pt-5">
              <div>
                <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-[rgba(244,239,230,0.55)]">
                  Selected Guide
                </p>
                <p className="font-mono text-sm tracking-[0.06em] text-[#C29B38]">
                  {selectedResidence.priceFormatted}
                </p>
              </div>
              <button
                type="submit"
                className="rounded-[2px] bg-[#F4EFE6] px-5 py-2.5 text-xs font-medium tracking-[0.12em] uppercase text-[#09090B] transition-colors duration-150 hover:bg-[#C29B38] focus-visible:outline-2 focus-visible:outline-[#C29B38] whitespace-nowrap shrink-0"
              >
                Submit Private Inquiry
              </button>
            </div>
          </form>
        )}
      </aside>
    </div>
  );
}
