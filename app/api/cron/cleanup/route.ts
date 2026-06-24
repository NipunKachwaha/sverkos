import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase"; // Service Role Client zaroori hai

// Vercel Cron is API ko call karega, isliye ek secret key se protect karna zaroori hai
export async function GET(req: Request) {
  try {
    // Security Check: Make sure request trusted source se aa rahi hai
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 30 din purani date calculate karein
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 14);
    const dateString = thirtyDaysAgo.toISOString();

    console.log("Starting DB and Storage Cleanup...");

    // 1. Purani Chat Storage States (History) ko database se nikalna
    const { data: oldStates, error: fetchError } = await supabase
      .from("chat_messages_storage_state")
      .select("id, storage_url, snapshot_url")
      .lt("created_at", dateString); // 30 din se purane

    if (fetchError) throw fetchError;

    let deletedFilesCount = 0;

    // 2. Files delete from Supabase Storage
    if (oldStates && oldStates.length > 0) {
      const filesToDelete = oldStates
        .map(state => state.storage_url) // Note: Yahan aapko URL se filename extract karne ka logic lagana pad sakta hai
        .filter(url => url !== null) as string[];

      if (filesToDelete.length > 0) {
        // Supabase storage bucket se files delete karein (maan lo bucket ka naam 'chat-files' hai)
        const { error: storageError } = await supabase.storage
          .from("chat-files")
          .remove(filesToDelete);

        if (storageError) {
          console.error("Error deleting from Supabase Storage:", storageError);
        } else {
          deletedFilesCount = filesToDelete.length;
        }
      }

      // 3. Database rows delete karein
      const idsToDelete = oldStates.map(state => state.id);
      const { error: dbDeleteError } = await supabase
        .from("chat_messages_storage_state")
        .delete()
        .in("id", idsToDelete);

      if (dbDeleteError) throw dbDeleteError;
    }

    return NextResponse.json({ 
      success: true, 
      message: "Cleanup completed",
      deletedRows: oldStates?.length || 0,
      deletedFiles: deletedFilesCount
    }, { status: 200 });

  } catch (error) {
    console.error("Cleanup cron failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}