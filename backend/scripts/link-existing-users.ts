
// One-time migration: give BarBuddy accounts created before Supabase Auth
// (rows in bb_users_tbl with no auth_user_id) a Supabase Auth login.
//
//   Preview:  npx tsx --env-file=.env scripts/link-existing-users.ts
//   Apply:    npx tsx --env-file=.env scripts/link-existing-users.ts --apply
//
// Each account gets a confirmed Supabase Auth user with the same email.
// If the row still has its old password, that password keeps working;
// otherwise the user should use "Forgot password?" on the login page.
// The existing bb_users_tbl row is linked to the new auth user; no new
// profile is created. Requires the trigger fix in
// supabase/migrations/20261014_link_existing_barbuddy_profiles.sql.

import { supabaseAdmin } from '../src/lib/supabase';

const apply = process.argv.includes('--apply');

async function main() {
  const { data: rows, error } = await supabaseAdmin
    .from('bb_users_tbl')
    .select('user_id, user_email, user_fname, user_lname, user_contact, user_password')
    .is('auth_user_id', null);

  if (error) throw error;

  if (!rows || rows.length === 0) {
    console.log('Every BarBuddy account is already linked to Supabase Auth.');
    return;
  }

  console.log(`${rows.length} account(s) without a Supabase Auth login:`);

  for (const row of rows) {
    const email = String(row.user_email || '').trim().toLowerCase();
    const label = `${row.user_fname} ${row.user_lname} <${email}>`;

    if (!email) {
      console.log(`  SKIP ${label}: no email`);
      continue;
    }

    const usablePassword =
      row.user_password && row.user_password.length >= 6 ? row.user_password : undefined;

    if (!apply) {
      console.log(
        `  WOULD CREATE ${label} (${usablePassword ? 'keeps old password' : 'must use Forgot password'})`
      );
      continue;
    }

    const { data: created, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: usablePassword,
        email_confirm: true,
        user_metadata: {
          first_name: row.user_fname,
          last_name: row.user_lname,
          contact_number: row.user_contact,
        },
      });

    if (createError || !created.user) {
      // Print every field Supabase returned (never includes the API key)
      console.log(`  FAILED ${label}:`, {
        name: createError?.name,
        message: createError?.message,
        status: (createError as any)?.status,
        code: (createError as any)?.code,
        ...Object.fromEntries(
          Object.entries(createError || {}).filter(([key]) => key !== 'stack')
        ),
      });
      continue;
    }

    const authId = created.user.id;

    // The signup trigger links the existing profile for confirmed emails
    // (supabase/migrations/20261014_link_existing_barbuddy_profiles.sql).
    // Make sure the link is in place without touching any other row.
    const { error: linkError } = await supabaseAdmin
      .from('bb_users_tbl')
      .update({ auth_user_id: authId })
      .eq('user_id', row.user_id)
      .is('auth_user_id', null);

    if (linkError) {
      console.log(`  FAILED to link ${label}: ${linkError.message}`);
      continue;
    }

    const { data: profiles } = await supabaseAdmin
      .from('bb_users_tbl')
      .select('user_id')
      .eq('auth_user_id', authId);

    const linkedIds = (profiles || []).map((p) => p.user_id);

    if (linkedIds.length !== 1 || linkedIds[0] !== row.user_id) {
      console.log(`  WARNING ${label}: unexpected profiles linked to the new auth user:`, linkedIds);
      continue;
    }

    console.log(
      `  LINKED ${label} (${usablePassword ? 'old password still works' : 'must use Forgot password'})`
    );
  }

  if (!apply) {
    console.log('\nPreview only. Run again with --apply to make these changes.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
