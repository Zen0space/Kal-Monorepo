'use client';

type Props = {
  onSignOut: () => Promise<void>;
};

export default function SignOut({ onSignOut }: Props) {
  return (
    <button
      onClick={() => onSignOut()}
      className="sign-out-btn"
    >
      Sign Out
    </button>
  );
}
