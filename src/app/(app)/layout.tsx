return (
  <div className='flex min-h-screen bg-[#f8f9fb] overflow-hidden'>
    <Sidebar
      role={(profile?.role as UserRole) ?? "student"}
      fullName={profile?.full_name ?? null}
      email={profile?.email ?? user.email ?? ""}
    />
    <main className='flex-1 overflow-auto min-h-screen'>{children}</main>
  </div>
);
