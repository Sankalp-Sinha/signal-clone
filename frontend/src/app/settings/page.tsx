"use client";

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-[#f6f6f6] p-8 text-black">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-3xl font-bold">Settings</h1>

        <div className="space-y-4">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="font-semibold">Profile</h2>
            <p className="mt-2 text-sm text-gray-500">
              Manage profile photo and display name.
            </p>
            <p className="mt-2 text-blue-500">Coming Soon</p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="font-semibold">Privacy</h2>
            <p className="mt-2 text-sm text-gray-500">
              Last seen, blocked users and privacy controls.
            </p>
            <p className="mt-2 text-blue-500">Coming Soon</p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="font-semibold">Notifications</h2>
            <p className="mt-2 text-sm text-gray-500">
              Notification preferences and sounds.
            </p>
            <p className="mt-2 text-blue-500">Coming Soon</p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="font-semibold">Appearance</h2>
            <p className="mt-2 text-sm text-gray-500">
              Theme and chat appearance settings.
            </p>
            <p className="mt-2 text-blue-500">Coming Soon</p>
          </div>
        </div>
      </div>
    </main>
  );
}