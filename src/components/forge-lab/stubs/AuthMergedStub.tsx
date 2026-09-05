'use client';

/** Sign-on HTML 1:1 placeholder in the authMerged center glass. Stub only. */
export function AuthMergedStub() {
  return (
    <form
      className="fl-auth"
      data-slot="auth-merged"
      onSubmit={(e) => e.preventDefault()}
    >
      <p className="fl-stub-note">
        Sign-on stub. Left and right wings merge into this wide center glass.
      </p>
      <label className="fl-auth__field">
        Email
        <input type="email" name="email" autoComplete="username" />
      </label>
      <label className="fl-auth__field">
        Password
        <input type="password" name="password" autoComplete="current-password" />
      </label>
      <button type="submit" className="fl-chip">
        Continue
      </button>
    </form>
  );
}
