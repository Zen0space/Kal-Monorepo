'use client';

type Props = {
  onSignIn: () => Promise<void>;
};

export default function SignIn({ onSignIn }: Props) {
  return (
    <button
      onClick={() => onSignIn()}
      className="sign-in-btn"
    >
      Sign In
    </button>
  );
}
