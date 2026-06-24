import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const subscriptionId = searchParams.get('subscriptionId');

  if (!subscriptionId) {
    return NextResponse.json({ error: 'subscriptionId is required' }, { status: 400 });
  }

  try {
    const { data: subscription, error } = await supabaseAdmin
      .from('subscriptions')
      .select('status, subscriber_id')
      .eq('asaas_subscription_id', subscriptionId)
      .single();

    if (error || !subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      status: subscription.status,
      subscriber_id: subscription.subscriber_id 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
